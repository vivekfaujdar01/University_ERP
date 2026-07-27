import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectCurrentUser } from '@/features/authSlice';
import {
  useGetUserQuery,
  useUpdateFacultyProfileMutation,
  useGetSubjectsQuery,
  useGetTimeSlotsQuery,
} from '@/services/structureApi';
import type { Subject, TimeSlot } from '@/types';

export default function FacultyProfilePage(): React.ReactElement {
  const currentUser = useAppSelector(selectCurrentUser);
  const { data: user, isLoading } = useGetUserQuery(currentUser?._id ?? '', { skip: !currentUser });
  const { data: allSubjects } = useGetSubjectsQuery({ limit: 200 });
  const { data: allSlots } = useGetTimeSlotsQuery({ limit: 200 });
  const [updateProfile, { isLoading: saving }] = useUpdateFacultyProfileMutation();

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

  // Initialise from loaded user data
  useEffect(() => {
    if (user) {
      setSelectedSubjects(
        (user.subjectsAssigned ?? []).map((s) => (typeof s === 'object' ? (s as Subject)._id : s))
      );
      setSelectedSlots(
        (user.preferredSlots ?? []).map((s) => (typeof s === 'object' ? (s as TimeSlot)._id : s))
      );
    }
  }, [user]);

  const toggleSubject = (id: string) =>
    setSelectedSubjects((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const toggleSlot = (id: string) =>
    setSelectedSlots((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const handleSave = async () => {
    if (!currentUser) return;
    try {
      await updateProfile({ id: currentUser._id, subjectsAssigned: selectedSubjects, preferredSlots: selectedSlots }).unwrap();
      toast.success('Profile updated successfully');
    } catch (e: unknown) {
      toast.error((e as { data?: { message?: string } })?.data?.message ?? 'Update failed');
    }
  };

  // Group time slots by day for easier display
  const slotsByDay = (allSlots?.items ?? []).reduce<Record<string, TimeSlot[]>>((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {});

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="My Profile"
        subtitle="Manage your assigned subjects and preferred time slots"
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-75 shadow-sm shadow-blue-500/20"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        }
      />

      {/* Info card */}
      {user && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-lg">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-slate-400">{user.email}</p>
            {user.designation && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{user.designation}</p>}
          </div>
        </div>
      )}

      {/* Subjects */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Assigned Subjects</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Select the subjects you teach. The scheduler uses this to assign classes to you.
        </p>
        {!allSubjects?.items.length ? (
          <p className="text-sm text-gray-400">No subjects available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {allSubjects.items.map((subject) => {
              const selected = selectedSubjects.includes(subject._id);
              return (
                <button
                  key={subject._id}
                  type="button"
                  onClick={() => toggleSubject(subject._id)}
                  aria-pressed={selected}
                  className={`text-left p-3 rounded-xl border-2 transition-all duration-150 ${
                    selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <p className={`text-sm font-medium ${selected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-slate-300'}`}>
                    {subject.name}
                  </p>
                  <p className={`text-xs mt-0.5 font-mono ${selected ? 'text-blue-500' : 'text-gray-400'}`}>
                    {subject.code} · Sem {subject.semester} · {subject.credits} cr
                  </p>
                </button>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          {selectedSubjects.length} subject{selectedSubjects.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {/* Preferred slots */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Preferred Time Slots</h2>
        <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
          Mark slots you prefer. The scheduler will try to respect these where possible.
        </p>
        {!allSlots?.items.length ? (
          <p className="text-sm text-gray-400">No time slots configured yet.</p>
        ) : (
          <div className="space-y-4">
            {dayOrder.filter((d) => slotsByDay[d]).map((day) => (
              <div key={day}>
                <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">{day}</p>
                <div className="flex flex-wrap gap-2">
                  {slotsByDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((slot) => {
                    const selected = selectedSlots.includes(slot._id);
                    return (
                      <button
                        key={slot._id}
                        type="button"
                        onClick={() => toggleSlot(slot._id)}
                        aria-pressed={selected}
                        disabled={slot.isLunchBreak}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-150 ${
                          slot.isLunchBreak
                            ? 'opacity-40 cursor-not-allowed border-gray-200 dark:border-slate-700 text-gray-400'
                            : selected
                            ? 'border-blue-500 bg-blue-500 text-white shadow-sm shadow-blue-500/20'
                            : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        {slot.startTime}–{slot.endTime}
                        {slot.isLunchBreak && ' 🍽'}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
          {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
        </p>
      </div>
    </div>
  );
}
