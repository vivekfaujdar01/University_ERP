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
import {
  useGetBatchesQuery, useCreateBatchMutation,
  useUpdateBatchMutation, useDeleteBatchMutation,
  useGetProgramsQuery,
} from '@/services/structureApi';
import type { Batch, Program } from '@/types';

const schema = z.object({
  program: z.string().min(1, 'Program required'),
  year: z.coerce.number().int().min(2000).max(2100),
  section: z.string().min(1, 'Section required').toUpperCase(),
  maxStudents: z.coerce.number().int().min(1).max(500),
  academicYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;
const LIMIT = 15;

export default function BatchesPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Batch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Batch | null>(null);

  const { data, isLoading } = useGetBatchesQuery({ page, limit: LIMIT });
  const { data: programs } = useGetProgramsQuery({ limit: 100 });
  const [create] = useCreateBatchMutation();
  const [update] = useUpdateBatchMutation();
  const [remove, { isLoading: deleting }] = useDeleteBatchMutation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openCreate = () => { setEditing(null); reset({ program: '', year: new Date().getFullYear(), section: 'A', maxStudents: 60, academicYear: '' }); setModalOpen(true); };
  const openEdit = (b: Batch) => {
    setEditing(b);
    reset({ program: typeof b.program === 'object' ? (b.program as Program)._id : b.program, year: b.year, section: b.section, maxStudents: b.maxStudents, academicYear: b.academicYear ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, academicYear: data.academicYear || undefined };
      if (editing) { await update({ id: editing._id, data: payload }).unwrap(); toast.success('Batch updated'); }
      else { await create(payload).unwrap(); toast.success('Batch created'); }
      setModalOpen(false);
    } catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget._id).unwrap(); toast.success('Batch deleted'); setDeleteTarget(null); }
    catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Cannot delete'); }
  };

  const columns: Column<Batch>[] = [
    { key: 'program', header: 'Program', render: (b) => typeof b.program === 'object' ? (b.program as Program).code : '—' },
    { key: 'year', header: 'Year', render: (b) => <span className="font-semibold">{b.year}</span> },
    { key: 'section', header: 'Section', render: (b) => <span className="font-mono font-semibold">{b.section}</span> },
    { key: 'students', header: 'Students', render: (b) => `${b.currentStudentCount} / ${b.maxStudents}` },
    { key: 'academicYear', header: 'Academic Year', render: (b) => b.academicYear ?? '—' },
    { key: 'isActive', header: 'Status', render: (b) => <StatusBadge variant={b.isActive ? 'active' : 'inactive'} /> },
    { key: 'actions', header: '', render: (b) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={() => openEdit(b)} aria-label="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil size={14} /></button>
        <button type="button" onClick={() => setDeleteTarget(b)} aria-label="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  return (
    <div className="space-y-5">
      <PageHeader title="Batches" subtitle={`${data?.total ?? 0} batches`}
        actions={<button type="button" onClick={openCreate} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"><Plus size={16} />Add Batch</button>}
      />
      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} keyExtractor={(b) => b._id} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No batches yet." />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Batch' : 'New Batch'}
        footer={<>
          <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" form="batch-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-75">{isSubmitting ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <form id="batch-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="batch-prog" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Program</label>
            <select id="batch-prog" {...register('program')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select —</option>
              {programs?.items.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            {errors.program && <p className="text-xs text-red-500 mt-1">{errors.program.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="batch-year" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Admission Year</label>
              <input id="batch-year" type="number" {...register('year')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year.message}</p>}
            </div>
            <div>
              <label htmlFor="batch-section" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Section</label>
              <input id="batch-section" {...register('section')} placeholder="A" className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
              {errors.section && <p className="text-xs text-red-500 mt-1">{errors.section.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="batch-max" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Max Students</label>
              <input id="batch-max" type="number" {...register('maxStudents')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="batch-ay" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Academic Year</label>
              <input id="batch-ay" {...register('academicYear')} placeholder="2024-25" className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.academicYear && <p className="text-xs text-red-500 mt-1">{errors.academicYear.message}</p>}
            </div>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        message={`Delete batch "${deleteTarget?.year}-${deleteTarget?.section}"?`} confirmLabel="Delete" isLoading={deleting} />
    </div>
  );
}
