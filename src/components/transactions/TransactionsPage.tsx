import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search } from 'lucide-react';
import Header from '../layout/Header';
import TransactionList from './TransactionList';
import CategoryPicker from './CategoryPicker';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useFilters } from '../../hooks/useFilters';
import { suggestCategory } from '../../services/categoryService';
import { learnFromAssignment, findSimilarTransactions } from '../../services/categoryService';
import { db } from '../../db';
import type { Transaction } from '../../models/Transaction';
import type { TimePeriod } from '../../utils/dateHelpers';

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All' },
];

export default function TransactionsPage() {
  const { timePeriod, setTimePeriod, categoryIds, toggleCategory, clearCategories, searchQuery, setSearchQuery, transactionFilter } = useFilters();
  const { transactions, updateCategory, bulkUpdateCategory } = useTransactions(transactionFilter);
  const { categories, getCategoryMap } = useCategories();

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const categoryMap = useMemo(() => getCategoryMap(), [categories]);

  const rules = useLiveQuery(() => db.categoryRules.toArray()) ?? [];

  const suggestedCategoryId = useMemo(() => {
    if (!selectedTxn) return null;
    return suggestCategory(selectedTxn.description, rules);
  }, [selectedTxn, rules]);

  const handleCategorySelect = useCallback(async (categoryId: string, applyToSimilar: boolean) => {
    if (!selectedTxn) return;

    await updateCategory(selectedTxn.id, categoryId);

    if (applyToSimilar) {
      await learnFromAssignment(selectedTxn.description, categoryId);
      const similar = await findSimilarTransactions(selectedTxn.description);
      const uncategorized = similar.filter(t => !t.categoryId && t.id !== selectedTxn.id);
      if (uncategorized.length > 0) {
        await bulkUpdateCategory(uncategorized.map(t => t.id), categoryId);
      }
    }

    setSelectedTxn(null);
  }, [selectedTxn, updateCategory, bulkUpdateCategory]);

  // Count uncategorized
  const uncategorizedCount = transactions.filter(t => !t.categoryId && t.amount < 0).length;

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Transactions"
        rightAction={
          uncategorizedCount > 0 ? (
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
              {uncategorizedCount} uncategorized
            </span>
          ) : undefined
        }
      />

      {/* Search bar */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 border border-slate-700 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Time filter pills */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {TIME_PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setTimePeriod(p.value)}
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

      {/* Category filter pills */}
      {categories.length > 0 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto scrollbar-hide">
          {categoryIds.length > 0 && (
            <button
              onClick={clearCategories}
              className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 whitespace-nowrap"
            >
              Clear
            </button>
          )}
          {categories.filter(c => c.name !== 'Income').map(cat => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryIds.includes(cat.id)
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              style={categoryIds.includes(cat.id) ? { backgroundColor: cat.color } : undefined}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Transaction list */}
      <div className="flex-1 overflow-y-auto">
        <TransactionList
          transactions={transactions}
          categoryMap={categoryMap}
          onTransactionTap={setSelectedTxn}
        />
      </div>

      {/* Category picker modal */}
      {selectedTxn && (
        <CategoryPicker
          suggestedCategoryId={suggestedCategoryId}
          onSelect={handleCategorySelect}
          onClose={() => setSelectedTxn(null)}
        />
      )}
    </div>
  );
}
