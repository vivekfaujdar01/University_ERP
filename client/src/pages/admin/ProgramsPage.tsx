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
  useGetProgramsQuery, useCreateProgramMutation,
  useUpdateProgramMutation, useDeleteProgramMutation,
  useGetDepartmentsQuery,
} from '@/services/structureApi';
import type { Program, Department } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  code: z.string().min(2, 'Code required'),
  department: z.string().min(1, 'Department required'),
  durationYears: z.coerce.number().int().min(1).max(6),
  totalSemesters: z.coerce.number().int().min(1).max(12),
});
type FormData = z.infer<typeof schema>;
const LIMIT = 15;

export default function ProgramsPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);

  const { data, isLoading } = useGetProgramsQuery({ page, limit: LIMIT });
  const { data: depts } = useGetDepartmentsQuery({ limit: 100 });
  const [create] = useCreateProgramMutation();
  const [update] = useUpdateProgramMutation();
  const [remove, { isLoading: deleting }] = useDeleteProgramMutation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openCreate = () => { setEditing(null); reset({ name: '', code: '', department: '', durationYears: 4, totalSemesters: 8 }); setModalOpen(true); };
  const openEdit = (p: Program) => {
    setEditing(p);
    reset({ name: p.name, code: p.code, department: typeof p.department === 'object' ? (p.department as Department)._id : p.department, durationYears: p.durationYears, totalSemesters: p.totalSemesters });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) { await update({ id: editing._id, data }).unwrap(); toast.success('Program updated'); }
      else { await create(data).unwrap(); toast.success('Program created'); }
      setModalOpen(false);
    } catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget._id).unwrap(); toast.success('Program deleted'); setDeleteTarget(null); }
    catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Cannot delete'); }
  };

  const getDeptName = (p: Program) => typeof p.department === 'object' ? (p.department as Department).name : '—';

  const columns: Column<Program>[] = [
    { key: 'code', header: 'Code', render: (p) => <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{p.code}</span> },
    { key: 'name', header: 'Name', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'department', header: 'Department', render: getDeptName },
    { key: 'durationYears', header: 'Duration', render: (p) => `${p.durationYears} yr / ${p.totalSemesters} sem` },
    { key: 'isActive', header: 'Status', render: (p) => <StatusBadge variant={p.isActive ? 'active' : 'inactive'} /> },
    { key: 'actions', header: '', render: (p) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={() => openEdit(p)} aria-label="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil size={14} /></button>
        <button type="button" onClick={() => setDeleteTarget(p)} aria-label="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  return (
    <div className="space-y-5">
      <PageHeader title="Programs" subtitle={`${data?.total ?? 0} programs`}
        actions={<button type="button" onClick={openCreate} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"><Plus size={16} />Add Program</button>}
      />
      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} keyExtractor={(p) => p._id} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No programs yet." />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Program' : 'New Program'}
        footer={<>
          <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" form="prog-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-75">{isSubmitting ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <form id="prog-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {[['name','Name','B.Tech Computer Science'],['code','Code','BTECH-CSE']].map(([f,l,ph]) => (
            <div key={f}>
              <label htmlFor={`prog-${f}`} className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{l}</label>
              <input id={`prog-${f}`} {...register(f as 'name'|'code')} placeholder={ph} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              {errors[f as keyof FormData] && <p className="text-xs text-red-500 mt-1">{errors[f as keyof FormData]?.message}</p>}
            </div>
          ))}
          <div>
            <label htmlFor="prog-dept" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Department</label>
            <select id="prog-dept" {...register('department')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select —</option>
              {depts?.items.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prog-dur" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Duration (years)</label>
              <input id="prog-dur" type="number" {...register('durationYears')} min={1} max={6} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="prog-sem" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Total Semesters</label>
              <input id="prog-sem" type="number" {...register('totalSemesters')} min={1} max={12} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        message={`Delete program "${deleteTarget?.name}"?`} confirmLabel="Delete" isLoading={deleting} />
    </div>
  );
}
