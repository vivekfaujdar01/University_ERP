import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import { useGetTimeSlotsQuery, useCreateTimeSlotMutation, useUpdateTimeSlotMutation, useDeleteTimeSlotMutation } from '@/services/structureApi';
import type { TimeSlot, WeekDay } from '@/types';

const schema = z.object({
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format: HH:MM'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format: HH:MM'),
  slotNumber: z.coerce.number().int().min(1).optional().or(z.literal('')),
  isLunchBreak: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;
const LIMIT = 50;

export default function TimeSlotsPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimeSlot | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimeSlot | null>(null);

  const { data, isLoading } = useGetTimeSlotsQuery({ page, limit: LIMIT });
  const [create] = useCreateTimeSlotMutation();
  const [update] = useUpdateTimeSlotMutation();
  const [remove, { isLoading: deleting }] = useDeleteTimeSlotMutation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openCreate = () => { setEditing(null); reset({ day: 'Monday', startTime: '09:00', endTime: '10:00', slotNumber: '', isLunchBreak: false }); setModalOpen(true); };
  const openEdit = (t: TimeSlot) => {
    setEditing(t);
    reset({ day: t.day, startTime: t.startTime, endTime: t.endTime, slotNumber: t.slotNumber ?? '', isLunchBreak: t.isLunchBreak });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, slotNumber: data.slotNumber ? Number(data.slotNumber) : undefined };
      if (editing) { await update({ id: editing._id, data: payload }).unwrap(); toast.success('Time slot updated'); }
      else { await create(payload).unwrap(); toast.success('Time slot created'); }
      setModalOpen(false);
    } catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget._id).unwrap(); toast.success('Time slot deleted'); setDeleteTarget(null); }
    catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Cannot delete'); }
  };

  const columns: Column<TimeSlot>[] = [
    { key: 'slotNumber', header: '#', render: (t) => t.slotNumber ?? '—' },
    { key: 'day', header: 'Day', render: (t) => <span className="font-medium">{t.day}</span> },
    { key: 'time', header: 'Time', render: (t) => <span className="font-mono text-sm">{t.startTime} – {t.endTime}</span> },
    { key: 'isLunchBreak', header: 'Type', render: (t) => t.isLunchBreak ? <StatusBadge variant="warning" label="Lunch" /> : <span className="text-gray-400">—</span> },
    { key: 'actions', header: '', render: (t) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={() => openEdit(t)} aria-label="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil size={14} /></button>
        <button type="button" onClick={() => setDeleteTarget(t)} aria-label="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  return (
    <div className="space-y-5">
      <PageHeader title="Time Slots" subtitle={`${data?.total ?? 0} time slots`}
        actions={<button type="button" onClick={openCreate} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"><Plus size={16} />Add Time Slot</button>}
      />
      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} keyExtractor={(t) => t._id} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No time slots yet." />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Time Slot' : 'New Time Slot'}
        footer={<>
          <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" form="slot-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-75">{isSubmitting ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <form id="slot-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="slot-day" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Day</label>
            <select id="slot-day" {...register('day')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as WeekDay[]).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="slot-start" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Start Time</label>
              <input id="slot-start" type="time" {...register('startTime')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.startTime && <p className="text-xs text-red-500 mt-1">{errors.startTime.message}</p>}
            </div>
            <div>
              <label htmlFor="slot-end" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">End Time</label>
              <input id="slot-end" type="time" {...register('endTime')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.endTime && <p className="text-xs text-red-500 mt-1">{errors.endTime.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="slot-num" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Slot Number (optional)</label>
            <input id="slot-num" type="number" {...register('slotNumber')} placeholder="1" min={1} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <input id="slot-lunch" type="checkbox" {...register('isLunchBreak')} className="rounded" />
            <label htmlFor="slot-lunch" className="text-sm font-medium text-gray-700 dark:text-slate-300">Is Lunch Break</label>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        message={`Delete time slot "${deleteTarget?.day} ${deleteTarget?.startTime}–${deleteTarget?.endTime}"?`} confirmLabel="Delete" isLoading={deleting} />
    </div>
  );
}
