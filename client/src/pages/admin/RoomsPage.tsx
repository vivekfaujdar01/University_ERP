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
import { useGetRoomsQuery, useCreateRoomMutation, useUpdateRoomMutation, useDeleteRoomMutation } from '@/services/structureApi';
import type { Room } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name required'),
  capacity: z.coerce.number().int().min(1).max(1000),
  isLab: z.boolean().optional(),
  building: z.string().optional(),
  floor: z.coerce.number().int().optional().or(z.literal('')),
  facilities: z.string().optional(),
});
type FormData = z.infer<typeof schema>;
const LIMIT = 20;

export default function RoomsPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);

  const { data, isLoading } = useGetRoomsQuery({ page, limit: LIMIT });
  const [create] = useCreateRoomMutation();
  const [update] = useUpdateRoomMutation();
  const [remove, { isLoading: deleting }] = useDeleteRoomMutation();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const openCreate = () => { setEditing(null); reset({ name: '', capacity: 60, isLab: false, building: '', floor: '', facilities: '' }); setModalOpen(true); };
  const openEdit = (r: Room) => {
    setEditing(r);
    reset({ name: r.name, capacity: r.capacity, isLab: r.isLab, building: r.building ?? '', floor: r.floor ?? '', facilities: r.facilities.join(', ') });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = { ...data, facilities: data.facilities?.split(',').map((f) => f.trim()).filter(Boolean) ?? [], floor: data.floor ? Number(data.floor) : undefined };
      if (editing) { await update({ id: editing._id, data: payload }).unwrap(); toast.success('Room updated'); }
      else { await create(payload).unwrap(); toast.success('Room created'); }
      setModalOpen(false);
    } catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Failed'); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try { await remove(deleteTarget._id).unwrap(); toast.success('Room deleted'); setDeleteTarget(null); }
    catch (e: unknown) { toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Cannot delete'); }
  };

  const columns: Column<Room>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{r.name}</span> },
    { key: 'capacity', header: 'Capacity', render: (r) => <span className="font-semibold">{r.capacity}</span> },
    { key: 'type', header: 'Type', render: (r) => <StatusBadge variant={r.isLab ? 'lab' : 'theory'} label={r.isLab ? 'Lab' : 'Classroom'} /> },
    { key: 'location', header: 'Location', render: (r) => r.building ? `${r.building}${r.floor ? `, Floor ${r.floor}` : ''}` : '—' },
    { key: 'facilities', header: 'Facilities', render: (r) => r.facilities.length > 0 ? r.facilities.join(', ') : '—', className: 'text-xs' },
    { key: 'isActive', header: 'Status', render: (r) => <StatusBadge variant={r.isActive ? 'active' : 'inactive'} /> },
    { key: 'actions', header: '', render: (r) => (
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={() => openEdit(r)} aria-label="Edit" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Pencil size={14} /></button>
        <button type="button" onClick={() => setDeleteTarget(r)} aria-label="Delete" className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={14} /></button>
      </div>
    )},
  ];

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  return (
    <div className="space-y-5">
      <PageHeader title="Rooms" subtitle={`${data?.total ?? 0} rooms`}
        actions={<button type="button" onClick={openCreate} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"><Plus size={16} />Add Room</button>}
      />
      <DataTable columns={columns} data={data?.items ?? []} isLoading={isLoading} keyExtractor={(r) => r._id} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No rooms yet." />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Room' : 'New Room'}
        footer={<>
          <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" form="room-form" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-75">{isSubmitting ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <form id="room-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="room-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Room Name</label>
              <input id="room-name" {...register('name')} placeholder="R101, Lab-A" className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="room-capacity" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Capacity</label>
              <input id="room-capacity" type="number" {...register('capacity')} min={1} className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="room-building" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Building</label>
              <input id="room-building" {...register('building')} placeholder="Main Block" className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="room-floor" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Floor</label>
              <input id="room-floor" type="number" {...register('floor')} placeholder="1" className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label htmlFor="room-facilities" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Facilities (comma-separated)</label>
            <input id="room-facilities" {...register('facilities')} placeholder="projector, AC, computers" className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <input id="room-islab" type="checkbox" {...register('isLab')} className="rounded" />
            <label htmlFor="room-islab" className="text-sm font-medium text-gray-700 dark:text-slate-300">Is Lab / Computer Room</label>
          </div>
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        message={`Delete room "${deleteTarget?.name}"?`} confirmLabel="Delete" isLoading={deleting} />
    </div>
  );
}
