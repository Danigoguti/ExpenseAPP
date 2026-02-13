import type { TimePeriod } from '../../utils/dateHelpers';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
];

interface FilterBarProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export default function FilterBar({ timePeriod, onTimePeriodChange }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
      {TIME_PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => onTimePeriodChange(p.value)}
          className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            timePeriod === p.value
              ? 'bg-sky-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
