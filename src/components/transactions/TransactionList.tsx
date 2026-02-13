import { useMemo } from 'react';
import { startOfDay } from 'date-fns';
import type { Transaction } from '../../models/Transaction';
import type { Category } from '../../models/Category';
import TransactionItem from './TransactionItem';
import { formatDateGroup, formatCurrency } from '../../utils/formatters';

interface TransactionListProps {
  transactions: Transaction[];
  categoryMap: Map<string, Category>;
  onTransactionTap: (transaction: Transaction) => void;
}

interface DateGroup {
  dateKey: string;
  label: string;
  dayTotal: number;
  transactions: Transaction[];
  currency: string;
}

export default function TransactionList({ transactions, categoryMap, onTransactionTap }: TransactionListProps) {
  const groups = useMemo<DateGroup[]>(() => {
    const map = new Map<string, DateGroup>();

    for (const txn of transactions) {
      const dayStart = startOfDay(txn.startedDate);
      const key = dayStart.toISOString();

      if (!map.has(key)) {
        map.set(key, {
          dateKey: key,
          label: formatDateGroup(dayStart),
          dayTotal: 0,
          transactions: [],
          currency: txn.currency,
        });
      }

      const group = map.get(key)!;
      group.transactions.push(txn);
      if (txn.amount < 0) {
        group.dayTotal += txn.amount;
      }
    }

    return Array.from(map.values());
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-slate-400">No transactions found</p>
      </div>
    );
  }

  return (
    <div>
      {groups.map(group => (
        <div key={group.dateKey}>
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
            <span className="text-xs font-medium text-slate-400">{group.label}</span>
            {group.dayTotal !== 0 && (
              <span className="text-xs font-medium text-red-400">
                {formatCurrency(group.dayTotal, group.currency)}
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-800/50">
            {group.transactions.map(txn => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                category={txn.categoryId ? categoryMap.get(txn.categoryId) : undefined}
                onTap={onTransactionTap}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
