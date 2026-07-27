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
  useGetSubjectsQuery, useCreateSubjectMutation,
  useUpdateSubjectMutation, useDeleteSubjectMutation,
  useGetDepartmentsQuery, useGetProgramsQuery,
} from '@/services/structureApi';
import type { Subject, Department, Program, SubjectType } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  code: z.string().min(2, 'Code required'),
  credits: z.coerce.number().int().min(1).max(5),
  isLab: z.boolean().optional(),
  hoursPerWeek: z.coerce.number().int().min(1).max(20),
  department: z.string().min(1, 'Department required'),
  program: z.string().min(1, 'Program required'),
  semester: z.coerce.number().int().min(1).max(12),
  subjectType: z.enum(['theory', 'lab', 'tutorial', 'project']),
});
type FormData = z.infer<typeof schema>;
const LIMIT = 20;

export default function SubjectsPage() {
  const [page, setPage] = useState(1);
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const { data, isLoading } = useGetSubjectsQuery({
    page, limit: LIMIT,
    department: filterDept || undefined,
    semester: filterSem ? Number(filterSem) : undefined,
    search: search || undefined,
  });
  const { data: depts } = useGetDepartmentsQuery({ limit: 100 });
  const { data: programs } = useGetProgramsQuery({ limit: 100, department: filterDept || undefined });
  const [create] = useCreateSubjectMutation();
  const [update] = useUpdateSubjectMutation();
  const [remove, { isLoading: deleting }] = useDeleteSubjectMutation();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { subjectType: 'theory', credits: 3, hoursPerWeek: 3, semester: 1 } });
  const watchedType = watch('subjectType');

  const openCreate = () => { setEditing(null); reset({ name: '', code: '', credits: 3, isLab: false, hoursPerWeek: 3, department: filterDept, program: '', semester: 1, subjectType: 'theory' }); setModalOpen(true); };
  const openEdit = (s: Subject) => {
    setEditing(s);
    reset({ name: s.name, code: s.code, credits: s.credits, isLab: s.isLab, hoursPerWeek: s.hoursPerWeek, department: typeof s.department === 'object' ? (s.department as Department)._id : s.department, program: typeof s.program === 'object' ? (s.program as Program)._id : s.program, semester: s.semester, subjectType: s.subjectType });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editing) { await update({ id: editing._id, data }).unwrap(); toast.success('Subject updated'); }
      else { await create(data).unwrap(); toast.success('Subject created'); }
      setModalOpen(false);
    } catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget._id).unwrap(); toast.success('Subject deleted'); setDeleteTarget(null); }
    catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Cannot delete'); }
  };

  const typeVariant = (t: SubjectType) => ({ theory: 'theory', lab: 'lab', tutorial: 'tutorial', project: 'project' })[t] as SubjectType;

  const columns: Column<Subject>[] = [
    { key: 'code', header: 'Code', render: (s) => <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{s.code}</span> },
    { key: 'name', header: 'Name', render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'semester', header: 'Sem', render: (s) => <span className="font-semibold">{s.semester}</span> },
    { key: 'credits', header: 'Credits' },
    { key: 'subjectType', header: 'Type', render: (s) => <StatusBadge variant={typeVariant(s.subjectType)} label={s.subjectType} /> },
    { key: 'isActive', header: 'Status', render: (s) => <StatusBadge variant={s.isActive ? 'active' : 'inactive'} /> },
    { key: 'actions', header: '', render: (s) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={() => openEdit(s)} aria-label="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil size={14} /></button>
        <button type="button" onClick={() => setDeleteTarget(s)} aria-label="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  return (
    <div className="space-y-5">
      <PageHeader title="Subjects" subtitle={`${data?.total ?? 0} subjects`}
        actions={<button type="button" onClick={openCreate} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"><Plus size={16} />Add Subject</button>}
      />
      <div className="flex flex-wrap gap-3">
        <input type="search" placeholder="Search…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-48" aria-label="Search subjects" />
        <select value={filterDept} onChange={(e) => { setFilterDept(e.target.value); setPage(1); }} className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" aria-label="Filter by department">
          <option value="">All Departments</option>
          {depts?.items.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select value={filterSem} onChange={(e) => { setFilterSem(e.target.value); setPage(1); }} className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" aria-label="Filter by semester">
          <option value="">All Semesters</option>
          {[1,2,3,4,5,6,7,8].map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} keyExtractor={(s) => s._id} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No subjects found." />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'New Subject'} size="lg"
        footer={<>
          <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" form="subj-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-75">{isSubmitting ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <form id="subj-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="subj-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Name</label>
              <input id="subj-name" {...register('name')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="subj-code" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Code</label>
              <input id="subj-code" {...register('code')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
              {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="subj-credits" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Credits</label>
              <input id="subj-credits" type="number" {...register('credits')} min={1} max={5} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="subj-hrs" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Hrs/Week</label>
              <input id="subj-hrs" type="number" {...register('hoursPerWeek')} min={1} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="subj-sem" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Semester</label>
              <input id="subj-sem" type="number" {...register('semester')} min={1} max={12} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="subj-type" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Type</label>
              <select id="subj-type" {...register('subjectType')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="theory">Theory</option>
                <option value="lab">Lab</option>
                <option value="tutorial">Tutorial</option>
                <option value="project">Project</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer">
                <input type="checkbox" {...register('isLab')} defaultChecked={watchedType === 'lab'} className="rounded" />
                Is Lab Room Required
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="subj-dept" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Department</label>
              <select id="subj-dept" {...register('department')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select —</option>
                {depts?.items.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department.message}</p>}
            </div>
            <div>
              <label htmlFor="subj-prog" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Program</label>
              <select id="subj-prog" {...register('program')} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Select —</option>
                {programs?.items.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              {errors.program && <p className="text-xs text-red-500 mt-1">{errors.program.message}</p>}
            </div>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        message={`Delete subject "${deleteTarget?.name}"?`} confirmLabel="Delete" isLoading={deleting} />
    </div>
  );
}
