import { TrendingDown, Calendar, Hash, Crown } from 'lucide-react';
import type { SummaryStats } from '../../services/analyticsService';
import { formatCurrency } from '../../utils/formatters';

interface SummaryCardsProps {
  stats: SummaryStats;
  currency?: string;
}

export default function SummaryCards({ stats, currency = 'EUR' }: SummaryCardsProps) {
  const cards = [
    {
      label: 'Total Spent',
      value: formatCurrency(stats.totalSpent, currency),
      icon: TrendingDown,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Avg / Day',
      value: formatCurrency(stats.avgPerDay, currency),
      icon: Calendar,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Transactions',
      value: stats.transactionCount.toString(),
      icon: Hash,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Top Category',
      value: stats.topCategory?.name ?? 'N/A',
      icon: Crown,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      subtitle: stats.topCategory ? formatCurrency(stats.topCategory.total, currency) : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(card => (
        <div key={card.label} className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-7 h-7 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon size={14} className={card.color} />
            </div>
            <span className="text-xs text-slate-400">{card.label}</span>
          </div>
          <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          {card.subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{card.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
