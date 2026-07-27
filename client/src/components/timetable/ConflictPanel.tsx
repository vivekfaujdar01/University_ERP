import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { TimetableConflict } from '@/types';

interface ConflictPanelProps {
  conflicts: TimetableConflict[];
}

const TYPE_LABELS: Record<TimetableConflict['type'], string> = {
  teacher:  'Teacher Clash',
  room:     'Room Unavailable',
  batch:    'Batch Clash',
  capacity: 'Room Too Small',
  lab:      'No Lab Available',
};

const TYPE_COLOUR: Record<TimetableConflict['type'], string> = {
  teacher:  'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
  room:     'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:border-orange-800',
  batch:    'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800',
  capacity: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800',
  lab:      'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800',
};

export default function ConflictPanel({ conflicts }: ConflictPanelProps) {
  if (conflicts.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <CheckCircle2 className="text-green-500 shrink-0" size={20} />
        <div>
          <p className="font-semibold text-green-700 dark:text-green-400 text-sm">
            No conflicts — timetable is complete
          </p>
          <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
            All subjects have been assigned a slot and room.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="text-red-500 shrink-0" size={18} />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {conflicts.length} unresolved conflict{conflicts.length !== 1 ? 's' : ''}
        </h3>
        <span className="text-xs text-gray-400 dark:text-slate-500">
          — resolve manually or re-generate
        </span>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {conflicts.map((c, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 border rounded-xl px-3 py-2.5 text-xs ${TYPE_COLOUR[c.type]}`}
          >
            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold mr-1.5">{TYPE_LABELS[c.type]}:</span>
              {c.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
