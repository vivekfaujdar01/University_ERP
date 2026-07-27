
import { cn } from '@/utils/cn';

type Variant = 'active' | 'inactive' | 'paid' | 'partial' | 'unpaid' | 'overdue' | 'draft' | 'published' | 'lab' | 'theory' | 'tutorial' | 'project' | 'success' | 'warning' | 'error' | 'info';

const variantMap: Record<Variant, string> = {
  active:    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive:  'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  paid:      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  partial:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  unpaid:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  overdue:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  draft:     'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
  published: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  lab:       'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  theory:    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  tutorial:  'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  project:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  success:   'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning:   'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  error:     'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  info:      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

interface StatusBadgeProps {
  variant: Variant;
  label?: string;
  className?: string;
}

export default function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const text = label ?? variant.charAt(0).toUpperCase() + variant.slice(1);
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variantMap[variant], className)}>
      {text}
    </span>
  );
}
