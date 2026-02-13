import type { Transaction } from '../../models/Transaction';
import type { Category } from '../../models/Category';
import CategoryIcon from '../common/CategoryIcon';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onTap: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, category, onTap }: TransactionItemProps) {
  const isExpense = transaction.amount < 0;

  return (
    <button
      onClick={() => onTap(transaction)}
      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-slate-800/50 transition-colors text-left"
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: (category?.color ?? '#475569') + '20' }}
      >
        {category ? (
          <CategoryIcon icon={category.icon} color={category.color} size={20} />
        ) : (
          <span className="text-amber-400 text-sm font-bold">?</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 truncate">{transaction.description}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {category?.name ?? 'Uncategorized'} &middot; {formatDateTime(transaction.startedDate)}
        </p>
      </div>

      <span className={`text-sm font-semibold shrink-0 ${isExpense ? 'text-red-400' : 'text-emerald-400'}`}>
        {formatCurrency(transaction.amount, transaction.currency)}
      </span>
    </button>
  );
}
