import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Wand2, Upload, Loader2, Download, FolderOpen, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Modal from '@/components/ui/Modal';
import ConflictPanel from '@/components/timetable/ConflictPanel';
import TimetableGrid from '@/components/timetable/TimetableGrid';
import {
  useGenerateMutation, usePublishTimetableMutation, useOverrideEntryMutation,
  useGetTimetableByDeptQuery,
} from '@/services/timetableApi';
import { useGetDepartmentsQuery, useGetTimeSlotsQuery, useGetRoomsQuery } from '@/services/structureApi';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import type { TimetableDoc, TimetableEntry } from '@/types';

const schema = z.object({
  departmentId: z.string().min(1, 'Department required'),
  semester:     z.coerce.number().int().min(1).max(12),
  academicYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY e.g. 2024-25'),
});
type FormData = z.infer<typeof schema>;

const overrideSchema = z.object({
  timeSlotId: z.string().min(1, 'Time slot required'),
  roomId:     z.string().min(1, 'Room required'),
});
type OverrideFormData = z.infer<typeof overrideSchema>;

export default function TimetableGeneratePage(): React.ReactElement {
  const [timetable, setTimetable]             = useState<TimetableDoc | null>(null);
  const [overrideTarget, setOverrideTarget]   = useState<{ entry: TimetableEntry; index: number } | null>(null);

  const { data: depts }     = useGetDepartmentsQuery({ limit: 100 });
  const { data: slotsData } = useGetTimeSlotsQuery({ limit: 200 });
  const { data: roomsData } = useGetRoomsQuery({ limit: 100 });

  const [generate, { isLoading: generating }]   = useGenerateMutation();
  const [publish,  { isLoading: publishing }]   = usePublishTimetableMutation();
  const [override, { isLoading: overriding }]   = useOverrideEntryMutation();
  const { download, downloading }               = usePdfDownload();

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { semester: 5, academicYear: '2024-25' },
  });

  // Watch form values to auto-query existing timetable
  const watchedDeptId      = useWatch({ control, name: 'departmentId' });
  const watchedSemester    = useWatch({ control, name: 'semester' });
  const watchedAcademicYear = useWatch({ control, name: 'academicYear' });

  const canQuery = !!(
    watchedDeptId &&
    watchedSemester >= 1 &&
    /^\d{4}-\d{2}$/.test(watchedAcademicYear ?? '')
  );

  // Live query — fetches any existing timetable (draft or published) for the selected config
  const { data: existingTimetable, isFetching: loadingExisting } = useGetTimetableByDeptQuery(
    {
      departmentId: watchedDeptId ?? '',
      semester: Number(watchedSemester),
      academicYear: watchedAcademicYear ?? '',
    },
    { skip: !canQuery }
  );

  const {
    register: ovRegister, handleSubmit: ovSubmit, reset: ovReset,
    formState: { errors: ovErrors },
  } = useForm<OverrideFormData>({ resolver: zodResolver(overrideSchema) });

  const onGenerate = async (data: FormData) => {
    try {
      const result = await generate(data).unwrap();
      setTimetable(result);
      toast.success(`Generated ${result.entries.length} entries — ${result.conflicts.length} conflicts`);
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Generation failed');
    }
  };

  const onPublish = async () => {
    if (!timetable) return;
    try {
      const updated = await publish(timetable._id).unwrap();
      setTimetable(updated);
      toast.success('Timetable published successfully');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Publish failed');
    }
  };

  const onCellClick = (entry: TimetableEntry, index: number) => {
    if (timetable?.status === 'published') return;
    setOverrideTarget({ entry, index });
    ovReset({ timeSlotId: '', roomId: '' });
  };

  const onOverride = async (data: OverrideFormData) => {
    if (!timetable || overrideTarget === null) return;
    try {
      const updated = await override({
        id:         timetable._id,
        entryIndex: overrideTarget.index,
        ...data,
      }).unwrap();
      setTimetable(updated);
      toast.success('Entry overridden');
      setOverrideTarget(null);
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Override failed');
    }
  };

  const handlePdfDownload = () => {
    if (!timetable) return;
    const url = `${import.meta.env.VITE_API_URL as string}/timetable/${timetable._id}/pdf`;
    void download(url, `timetable-sem${timetable.semester}-${timetable.academicYear}.pdf`);
  };

  // When the active timetable is cleared (config changes), reset local state
  useEffect(() => {
    setTimetable(null);
    setOverrideTarget(null);
  }, [watchedDeptId, watchedSemester, watchedAcademicYear]);

  const inputCls = 'w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';
  const canPublish = timetable && timetable.status !== 'published' && timetable.isComplete;

  // Show the existing timetable info when none is loaded in state yet
  const showExistingBanner = canQuery && existingTimetable && !timetable && !loadingExisting;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate Timetable"
        subtitle="Run the DSA scheduling engine to auto-generate a conflict-free timetable"
        actions={
          timetable ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePdfDownload}
                disabled={downloading}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} Export PDF
              </button>
              <button
                type="button"
                onClick={onPublish}
                disabled={!canPublish || publishing}
                title={!timetable.isComplete ? 'Resolve all conflicts before publishing' : undefined}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-green-500/20"
              >
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {timetable.status === 'published' ? 'Published ✓' : 'Publish'}
              </button>
            </div>
          ) : undefined
        }
      />

      {/* Generate form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Configuration</h2>
        <form onSubmit={handleSubmit(onGenerate)} noValidate className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="gen-dept" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Department</label>
            <select id="gen-dept" {...register('departmentId')} className={inputCls}>
              <option value="">— Select —</option>
              {depts?.items.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            {errors.departmentId && <p className="text-xs text-red-500 mt-1">{errors.departmentId.message}</p>}
          </div>
          <div>
            <label htmlFor="gen-sem" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Semester</label>
            <input id="gen-sem" type="number" {...register('semester')} min={1} max={12} className={inputCls} />
            {errors.semester && <p className="text-xs text-red-500 mt-1">{errors.semester.message}</p>}
          </div>
          <div>
            <label htmlFor="gen-ay" className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Academic Year</label>
            <input id="gen-ay" {...register('academicYear')} placeholder="2024-25" className={inputCls} />
            {errors.academicYear && <p className="text-xs text-red-500 mt-1">{errors.academicYear.message}</p>}
          </div>
          <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={generating}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-75 shadow-sm shadow-blue-500/20"
            >
              {generating ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
              {generating ? 'Generating…' : (timetable ? 'Re-Generate' : 'Generate Timetable')}
            </button>
            {/* Loading indicator while checking for existing timetable */}
            {loadingExisting && canQuery && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-slate-500">
                <Loader2 size={13} className="animate-spin" /> Checking for existing timetable…
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Existing timetable banner (shown when a draft/published exists but isn't loaded yet) ── */}
      {showExistingBanner && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${
          existingTimetable.status === 'draft'
            ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
            : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
        }`}>
          <div className="flex items-start gap-3">
            <FolderOpen
              size={18}
              className={`mt-0.5 shrink-0 ${
                existingTimetable.status === 'draft'
                  ? 'text-amber-500'
                  : 'text-green-500'
              }`}
            />
            <div>
              <p className={`text-sm font-semibold ${
                existingTimetable.status === 'draft'
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-green-800 dark:text-green-300'
              }`}>
                {existingTimetable.status === 'draft'
                  ? '📝 Draft timetable found'
                  : '✅ Published timetable found'}
              </p>
              <p className={`text-xs mt-0.5 ${
                existingTimetable.status === 'draft'
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-green-700 dark:text-green-400'
              }`}>
                {existingTimetable.entries.length} entries
                {existingTimetable.conflicts.length > 0
                  ? ` · ${existingTimetable.conflicts.length} conflict${existingTimetable.conflicts.length !== 1 ? 's' : ''}`
                  : ' · No conflicts'}
                {' '}· Generated {new Date(existingTimetable.generatedAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTimetable(existingTimetable)}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-colors ${
                existingTimetable.status === 'draft'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <FolderOpen size={14} />
              {existingTimetable.status === 'draft' ? 'Load Draft' : 'View Published'}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {timetable && (
        <>
          {/* Status bar */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              timetable.status === 'published'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {timetable.status === 'draft' ? '📝 DRAFT' : '✅ PUBLISHED'}
            </span>
            <span className="text-gray-500 dark:text-slate-400">{timetable.entries.length} entries</span>
            <span className="text-gray-500 dark:text-slate-400">Sem {timetable.semester} / {timetable.academicYear}</span>
            {timetable.status === 'draft' && (
              <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <RefreshCw size={11} /> Click any cell to override slot/room
              </span>
            )}
          </div>

          {/* Conflict panel */}
          <ConflictPanel conflicts={timetable.conflicts} />

          {/* Grid */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
            <TimetableGrid
              timetable={timetable}
              onCellClick={timetable.status !== 'published' ? onCellClick : undefined}
            />
          </div>
        </>
      )}

      {/* Override modal */}
      <Modal
        open={!!overrideTarget}
        onClose={() => setOverrideTarget(null)}
        title="Override Entry"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setOverrideTarget(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" form="override-form" disabled={overriding} className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-75">
              {overriding ? 'Saving…' : 'Apply Override'}
            </button>
          </>
        }
      >
        <form id="override-form" onSubmit={ovSubmit(onOverride)} noValidate className="space-y-4">
          <div>
            <label htmlFor="ov-slot" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">New Time Slot</label>
            <select id="ov-slot" {...ovRegister('timeSlotId')} className={inputCls}>
              <option value="">— Select slot —</option>
              {slotsData?.items.filter((s) => !s.isLunchBreak).map((s) => (
                <option key={s._id} value={s._id}>{s.day} {s.startTime}–{s.endTime}</option>
              ))}
            </select>
            {ovErrors.timeSlotId && <p className="text-xs text-red-500 mt-1">{ovErrors.timeSlotId.message}</p>}
          </div>
          <div>
            <label htmlFor="ov-room" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">New Room</label>
            <select id="ov-room" {...ovRegister('roomId')} className={inputCls}>
              <option value="">— Select room —</option>
              {roomsData?.items.map((r) => (
                <option key={r._id} value={r._id}>{r.name} (cap. {r.capacity}{r.isLab ? ', Lab' : ''})</option>
              ))}
            </select>
            {ovErrors.roomId && <p className="text-xs text-red-500 mt-1">{ovErrors.roomId.message}</p>}
          </div>
        </form>
      </Modal>
    </div>
  );
}
