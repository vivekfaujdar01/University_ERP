import { useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import type { TimetableDoc, TimetableEntry, TimeSlot, Subject, User, Room, Batch } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;

/** Stable colour per subject code — cycles through a palette */
const PALETTE = [
  'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-200',
  'bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200',
  'bg-violet-100 border-violet-300 text-violet-900 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-200',
  'bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200',
  'bg-rose-100 border-rose-300 text-rose-900 dark:bg-rose-900/30 dark:border-rose-700 dark:text-rose-200',
  'bg-cyan-100 border-cyan-300 text-cyan-900 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-200',
  'bg-fuchsia-100 border-fuchsia-300 text-fuchsia-900 dark:bg-fuchsia-900/30 dark:border-fuchsia-700 dark:text-fuchsia-200',
  'bg-lime-100 border-lime-300 text-lime-900 dark:bg-lime-900/30 dark:border-lime-700 dark:text-lime-200',
];

function subjectColour(code: string, isConflict: boolean): string {
  if (isConflict) return 'bg-red-100 border-red-400 text-red-900 dark:bg-red-900/40 dark:border-red-600 dark:text-red-200';
  const hash = code.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length]!;
}

function asTimeSlot(v: TimeSlot | string): TimeSlot | null {
  return typeof v === 'object' ? v : null;
}
function asSubject(v: Subject | string): Subject | null {
  return typeof v === 'object' ? v : null;
}
function asUser(v: User | string): User | null {
  return typeof v === 'object' ? v : null;
}
function asRoom(v: Room | string): Room | null {
  return typeof v === 'object' ? v : null;
}
function asBatch(v: Batch | string): Batch | null {
  return typeof v === 'object' ? v : null;
}

// ─── Tooltip (portal-based) ───────────────────────────────────────────────────
// Rendered into document.body via createPortal so it always escapes the table's
// stacking context and is never clipped by sibling cells or overflow containers.

interface TipPosition { x: number; y: number }

interface TooltipProps {
  entry: TimetableEntry;
  pos: TipPosition;
}

const TOOLTIP_OFFSET = 14; // px gap from cursor

function CellTooltip({ entry, pos }: TooltipProps) {
  const subj  = asSubject(entry.subject);
  const fac   = asUser(entry.faculty);
  const room  = asRoom(entry.room);
  const batch = asBatch(entry.batch);
  const slot  = asTimeSlot(entry.timeSlot);

  // Nudge left if tooltip would overflow the right edge of the viewport
  const left = pos.x + TOOLTIP_OFFSET + 224 > window.innerWidth
    ? pos.x - 224 - TOOLTIP_OFFSET
    : pos.x + TOOLTIP_OFFSET;

  // Nudge up if tooltip would overflow the bottom edge
  const estimatedHeight = 130;
  const top = pos.y + TOOLTIP_OFFSET + estimatedHeight > window.innerHeight
    ? pos.y - estimatedHeight - TOOLTIP_OFFSET
    : pos.y + TOOLTIP_OFFSET;

  return createPortal(
    <div
      className="fixed z-[9999] w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-2xl p-3 text-xs space-y-1.5 pointer-events-none"
      style={{ top, left }}
    >
      {subj  && <p><span className="font-semibold">{subj.name}</span> <span className="text-gray-400">({subj.code})</span></p>}
      {fac   && <p className="text-gray-500"><span className="font-medium text-gray-700 dark:text-slate-300">Faculty:</span> {fac.name}</p>}
      {room  && <p className="text-gray-500"><span className="font-medium text-gray-700 dark:text-slate-300">Room:</span> {room.name}{room.capacity ? ` (cap. ${room.capacity})` : ''}</p>}
      {batch && <p className="text-gray-500"><span className="font-medium text-gray-700 dark:text-slate-300">Batch:</span> {batch.year}-{batch.section}</p>}
      {slot  && <p className="text-gray-500"><span className="font-medium text-gray-700 dark:text-slate-300">Time:</span> {slot.startTime}–{slot.endTime}</p>}
      {subj?.isLab && <span className="inline-block bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-1.5 py-0.5 rounded text-xs font-medium">Lab</span>}
    </div>,
    document.body
  );
}

// ─── Grid cell ────────────────────────────────────────────────────────────────

interface CellProps {
  entry: TimetableEntry;
  isConflict: boolean;
  onClick?: (entry: TimetableEntry, entryIndex: number) => void;
  entryIndex: number;
}

function TimetableCell({ entry, isConflict, onClick, entryIndex }: CellProps) {
  const [tipPos, setTipPos] = useState<TipPosition | null>(null);
  const subj = asSubject(entry.subject);
  const fac  = asUser(entry.faculty);
  const room = asRoom(entry.room);

  const colourCls = subjectColour(subj?.code ?? '', isConflict);

  return (
    <div
      className={cn(
        'relative border rounded-lg p-1.5 cursor-pointer select-none transition-all duration-100',
        'hover:shadow-md hover:scale-[1.02]',
        colourCls,
        onClick && 'hover:ring-2 hover:ring-blue-500'
      )}
      onMouseEnter={(e) => setTipPos({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e)  => setTipPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={()  => setTipPos(null)}
      onClick={() => onClick?.(entry, entryIndex)}
      role="button"
      tabIndex={0}
      aria-label={`${subj?.name ?? 'Subject'} — click to override`}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(entry, entryIndex); }}
    >
      <p className="font-bold text-xs leading-tight truncate">{subj?.code ?? '—'}</p>
      <p className="text-xs opacity-80 truncate">{fac?.name ?? '—'}</p>
      {room && <p className="text-xs opacity-60 truncate">{room.name}</p>}
      {isConflict && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" aria-label="Conflict" />
      )}
      {tipPos && <CellTooltip entry={entry} pos={tipPos} />}
    </div>
  );
}


// ─── Main grid ────────────────────────────────────────────────────────────────

interface TimetableGridProps {
  timetable: TimetableDoc;
  /** If provided, cells become clickable for manual override */
  onCellClick?: (entry: TimetableEntry, entryIndex: number) => void;
  /** Filter to specific batch id (for student view) */
  filterBatchId?: string;
  /** Filter to specific faculty id */
  filterFacultyId?: string;
}

export default function TimetableGrid({
  timetable,
  onCellClick,
  filterBatchId,
  filterFacultyId,
}: TimetableGridProps) {
  // Collect all unique time slots, sorted by slotNumber
  const slotMap = new Map<string, TimeSlot>();
  for (const entry of timetable.entries) {
    const ts = asTimeSlot(entry.timeSlot);
    if (ts?._id) slotMap.set(ts._id, ts);
  }
  const sortedSlots = [...slotMap.values()].sort(
    (a, b) => (a.slotNumber ?? 0) - (b.slotNumber ?? 0)
  );

  // Build conflict index: entryIndex → true
  const conflictIndexes = new Set<number>();
  for (const c of timetable.conflicts) {
    for (const idx of c.involvedEntryIndexes) conflictIndexes.add(idx);
  }

  // Filter entries
  const filteredEntries = timetable.entries.map((e, i) => ({ entry: e, index: i })).filter(({ entry }) => {
    if (filterBatchId) {
      const b = asBatch(entry.batch);
      if (b && b._id !== filterBatchId) return false;
      if (!b && entry.batch !== filterBatchId) return false;
    }
    if (filterFacultyId) {
      const f = asUser(entry.faculty);
      if (f && f._id !== filterFacultyId) return false;
      if (!f && entry.faculty !== filterFacultyId) return false;
    }
    return true;
  });

  if (sortedSlots.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">
        No timetable entries yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs" role="grid" aria-label="Timetable grid">
        <thead>
          <tr>
            <th className="bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-700 px-3 py-2 text-left font-semibold text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap w-24">
              Time
            </th>
            {DAYS.map((day) => (
              <th
                key={day}
                className="bg-gray-50 dark:bg-slate-700/60 border border-gray-200 dark:border-slate-700 px-3 py-2 text-center font-semibold text-gray-700 dark:text-slate-200 text-xs min-w-[100px]"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedSlots.map((slot) => (
            <tr key={slot._id}>
              <td className="border border-gray-200 dark:border-slate-700 px-3 py-2 bg-gray-50 dark:bg-slate-700/40 font-medium text-gray-600 dark:text-slate-400 whitespace-nowrap">
                {slot.isLunchBreak ? (
                  <span className="text-amber-600 dark:text-amber-400 italic">Lunch</span>
                ) : (
                  <span>{slot.startTime}–{slot.endTime}</span>
                )}
              </td>
              {DAYS.map((day) => {
                if (slot.isLunchBreak) {
                  return (
                    <td
                      key={day}
                      className="border border-gray-200 dark:border-slate-700 px-2 py-1 bg-amber-50 dark:bg-amber-900/10 text-center text-amber-600 dark:text-amber-400 italic text-xs"
                    >
                      Lunch Break
                    </td>
                  );
                }

                // Find entries for this day+slot
                const cellEntries = filteredEntries.filter(({ entry }) => {
                  const ts = asTimeSlot(entry.timeSlot);
                  return ts && ts._id === slot._id && ts.day === day;
                });

                return (
                  <td
                    key={day}
                    className="border border-gray-200 dark:border-slate-700 p-1 align-top min-w-[100px] max-w-[140px]"
                  >
                    <div className="space-y-1">
                      {cellEntries.map(({ entry, index }) => (
                        <TimetableCell
                          key={index}
                          entry={entry}
                          isConflict={conflictIndexes.has(index)}
                          onClick={onCellClick}
                          entryIndex={index}
                        />
                      ))}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
