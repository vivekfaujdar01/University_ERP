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
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetUsersQuery,
} from '@/services/structureApi';
import type { Department } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  code: z.string().min(2, 'Code required').toUpperCase(),
  hod: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const LIMIT = 15;

export default function DepartmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const { data, isLoading } = useGetDepartmentsQuery({ page, limit: LIMIT, search: search || undefined });
  const { data: hodList } = useGetUsersQuery({ role: 'hod', limit: 100 });
  const [create] = useCreateDepartmentMutation();
  const [update] = useUpdateDepartmentMutation();
  const [remove, { isLoading: deleting }] = useDeleteDepartmentMutation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => { setEditing(null); reset({ name: '', code: '', hod: '' }); setModalOpen(true); };
  const openEdit = (d: Department) => {
    setEditing(d);
    reset({ name: d.name, code: d.code, hod: typeof d.hod === 'object' ? d.hod?._id : d.hod ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, hod: data.hod || undefined };
      if (editing) {
        await update({ id: editing._id, data: payload }).unwrap();
        toast.success('Department updated');
      } else {
        await create(payload).unwrap();
        toast.success('Department created');
      }
      setModalOpen(false);
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove(deleteTarget._id).unwrap();
      toast.success('Department deleted');
      setDeleteTarget(null);
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Cannot delete');
    }
  };

  const columns: Column<Department>[] = [
    { key: 'code', header: 'Code', render: (d) => <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{d.code}</span> },
    { key: 'name', header: 'Name', render: (d) => <span className="font-medium">{d.name}</span> },
    { key: 'hod', header: 'HOD', render: (d) => typeof d.hod === 'object' && d.hod ? d.hod.name : '—' },
    { key: 'programs', header: 'Programs', render: (d) => <span className="text-gray-500">{Array.isArray(d.programs) ? d.programs.length : 0}</span> },
    { key: 'isActive', header: 'Status', render: (d) => <StatusBadge variant={d.isActive ? 'active' : 'inactive'} /> },
    {
      key: 'actions', header: '', render: (d) => (
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={() => openEdit(d)} aria-label="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil size={14} /></button>
          <button type="button" onClick={() => setDeleteTarget(d)} aria-label="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
        </div>
      ),
    },
  ];

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Departments"
        subtitle={`${data?.total ?? 0} departments`}
        actions={
          <button type="button" onClick={openCreate}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm shadow-blue-500/20">
            <Plus size={16} /> Add Department
          </button>
        }
      />

      {/* Search */}
      <input
        type="search" placeholder="Search by name or code…"
        value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        className="w-full max-w-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Search departments"
      />

      <DataTable
        columns={columns} data={data?.items ?? []} isLoading={isLoading}
        keyExtractor={(d) => d._id} page={page} totalPages={totalPages} onPageChange={setPage}
        emptyMessage="No departments yet. Add your first department."
      />

      {/* Create / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'New Department'}
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">Cancel</button>
            <button type="submit" form="dept-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-75">{isSubmitting ? 'Saving…' : 'Save'}</button>
          </>
        }
      >
        <form id="dept-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label htmlFor="dept-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label>
            <input id="dept-name" {...register('name')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" placeholder="Computer Science & Engineering" />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="dept-code" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Code</label>
            <input id="dept-code" {...register('code')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 uppercase" placeholder="CSE" />
            {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label htmlFor="dept-hod" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">HOD (optional)</label>
            <select id="dept-hod" {...register('hod')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— None —</option>
              {hodList?.items.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        message={`Delete department "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete" isLoading={deleting}
      />
    </div>
  );
}
