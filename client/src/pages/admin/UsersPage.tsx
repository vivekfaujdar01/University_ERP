import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Upload, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  useGetUsersQuery, useCreateUserMutation, useDeleteUserMutation,
  useBulkImportUsersMutation, useGetDepartmentsQuery,
  useGetProgramsQuery, useGetBatchesQuery,
} from '@/services/structureApi';
import type { User, Role } from '@/types';
import { ROLES } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/, 'Needs uppercase').regex(/[0-9]/, 'Needs number'),
  role: z.enum(['super_admin', 'hod', 'faculty', 'student', 'finance_officer'] as [Role, ...Role[]]),
  phone: z.string().optional(),
  enrollmentNumber: z.string().optional(),
  program: z.string().optional(),
  batch: z.string().optional(),
  semester: z.coerce.number().optional().or(z.literal('')),
  admissionYear: z.coerce.number().optional().or(z.literal('')),
  employeeId: z.string().optional(),
  designation: z.string().optional(),
  department: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const LIMIT = 20;
const ROLE_LABELS: Record<Role, string> = { super_admin: 'Super Admin', hod: 'HOD', faculty: 'Faculty', student: 'Student', finance_officer: 'Finance Officer' };

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<Role | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useGetUsersQuery({ page, limit: LIMIT, search: search || undefined, role: filterRole || undefined });
  const { data: depts } = useGetDepartmentsQuery({ limit: 100 });
  const { data: programs } = useGetProgramsQuery({ limit: 100 });
  const { data: batches } = useGetBatchesQuery({ limit: 100 });
  const [create] = useCreateUserMutation();
  const [remove, { isLoading: deleting }] = useDeleteUserMutation();
  const [bulkImport, { isLoading: importing }] = useBulkImportUsersMutation();

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'student' } });
  const watchedRole = watch('role');

  const openCreate = () => { reset({ name: '', email: '', password: '', role: 'student' }); setModalOpen(true); };

  const onSubmit = async (data: FormData) => {
    try {
      await create({ ...data, semester: data.semester ? Number(data.semester) : undefined, admissionYear: data.admissionYear ? Number(data.admissionYear) : undefined } as Parameters<typeof create>[0]).unwrap();
      toast.success('User created. Welcome email sent.');
      setModalOpen(false);
    } catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget._id).unwrap(); toast.success('User deactivated'); setDeleteTarget(null); }
    catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed'); }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const result = await bulkImport(fd).unwrap();
      toast.success(`Import done: ${result.created} created, ${result.skipped} skipped`);
      if (result.errors.length > 0) toast.warning(`${result.errors.length} rows had errors — check console`);
      setCsvModalOpen(false);
    } catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Import failed'); }
    if (csvRef.current) csvRef.current.value = '';
  };

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', render: (u) => <div><p className="font-medium">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div> },
    { key: 'role', header: 'Role', render: (u) => <StatusBadge variant={u.role === 'student' ? 'info' : u.role === 'faculty' || u.role === 'hod' ? 'published' : 'draft'} label={ROLE_LABELS[u.role]} /> },
    { key: 'id', header: 'ID', render: (u) => <span className="font-mono text-xs">{u.enrollmentNumber ?? u.employeeId ?? '—'}</span> },
    { key: 'isActive', header: 'Status', render: (u) => <StatusBadge variant={u.isActive ? 'active' : 'inactive'} /> },
    { key: 'actions', header: '', render: (u) => (
      <button type="button" onClick={() => setDeleteTarget(u)} aria-label="Deactivate user" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
    )},
  ];

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);
  const isStudent = watchedRole === ROLES.STUDENT;
  const isFacultyOrHod = watchedRole === ROLES.FACULTY || watchedRole === ROLES.HOD;
  const inputCls = 'w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-5">
      <PageHeader title="Users" subtitle={`${data?.total ?? 0} users`}
        actions={
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCsvModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"><Upload size={16} />CSV Import</button>
            <button type="button" onClick={openCreate} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"><Plus size={16} />Add User</button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3">
        <input type="search" placeholder="Search name, email, ID…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white placeholder-gray-400 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 w-56" aria-label="Search users" />
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value as Role | ''); setPage(1); }} className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" aria-label="Filter by role">
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} keyExtractor={(u) => u._id} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No users found." />

      {/* ── Create User Modal ─────────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add User" size="xl"
        footer={<>
          <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" form="user-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-75">{isSubmitting ? 'Creating…' : 'Create User'}</button>
        </>}
      >
        <form id="user-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="u-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name</label>
              <input id="u-name" {...register('name')} className={inputCls} placeholder="Arjun Patel" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="u-email" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input id="u-email" type="email" {...register('email')} className={inputCls} placeholder="user@university.edu" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="u-pass" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password</label>
              <input id="u-pass" type="password" {...register('password')} className={inputCls} placeholder="Min 8 chars, 1 upper, 1 number" />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="u-role" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Role</label>
              <select id="u-role" {...register('role')} className={inputCls}>
                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="u-phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone (optional)</label>
            <input id="u-phone" {...register('phone')} className={inputCls} placeholder="+91 98765 43210" />
          </div>

          {/* Student fields */}
          {isStudent && (
            <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-4 bg-blue-50/50 dark:bg-blue-900/10">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Student Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="u-enroll" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Enrollment No.</label>
                  <input id="u-enroll" {...register('enrollmentNumber')} className={inputCls} placeholder="CS21001" />
                </div>
                <div>
                  <label htmlFor="u-sem" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Semester</label>
                  <input id="u-sem" type="number" {...register('semester')} min={1} max={12} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="u-prog" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Program</label>
                  <select id="u-prog" {...register('program')} className={inputCls}>
                    <option value="">— Select —</option>
                    {programs?.items.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="u-batch" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Batch</label>
                  <select id="u-batch" {...register('batch')} className={inputCls}>
                    <option value="">— Select —</option>
                    {batches?.items.map((b) => <option key={b._id} value={b._id}>{b.year} – {b.section}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Faculty / HOD fields */}
          {isFacultyOrHod && (
            <div className="border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-4 bg-emerald-50/50 dark:bg-emerald-900/10">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Faculty Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="u-empid" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Employee ID</label>
                  <input id="u-empid" {...register('employeeId')} className={inputCls} placeholder="EMP-001" />
                </div>
                <div>
                  <label htmlFor="u-desig" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Designation</label>
                  <input id="u-desig" {...register('designation')} className={inputCls} placeholder="Assistant Professor" />
                </div>
              </div>
              <div>
                <label htmlFor="u-dept" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Department</label>
                <select id="u-dept" {...register('department')} className={inputCls}>
                  <option value="">— Select —</option>
                  {depts?.items.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* ── CSV Import Modal ──────────────────────────────────────────────── */}
      <Modal open={csvModalOpen} onClose={() => setCsvModalOpen(false)} title="Bulk Import Users via CSV" size="md">
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm space-y-2">
            <p className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2"><AlertCircle size={14} /> CSV Format</p>
            <p className="text-blue-600 dark:text-blue-400 font-mono text-xs">name, email, password, role, enrollmentNumber, employeeId, department, program, batch, semester, admissionYear, designation, phone</p>
            <p className="text-blue-600 dark:text-blue-400 text-xs">Role values: super_admin, hod, faculty, student, finance_officer</p>
          </div>
          <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-8 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-3">Select a CSV file to import</p>
            <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCsvUpload} id="csv-upload" className="hidden" aria-label="Upload CSV file" />
            <label htmlFor="csv-upload" className={`inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors ${importing ? 'opacity-75 pointer-events-none' : ''}`}>
              {importing ? 'Importing…' : 'Choose CSV File'}
            </label>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
            <CheckCircle2 size={12} className="text-green-500" />
            Duplicate emails are skipped automatically. Welcome emails sent to new users.
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        message={`Deactivate user "${deleteTarget?.name}"? They will no longer be able to log in.`}
        confirmLabel="Deactivate" isLoading={deleting} />
    </div>
  );
}
