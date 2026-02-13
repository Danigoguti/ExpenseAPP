import { useState, useMemo } from 'react';
import { type TimePeriod, getPeriodBounds } from '../utils/dateHelpers';
import type { TransactionFilter } from './useTransactions';

export interface FilterState {
  timePeriod: TimePeriod;
  categoryIds: string[];
  searchQuery: string;
}

export function useFilters() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCategory = (id: string) => {
    setCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const clearCategories = () => setCategoryIds([]);

  const resetFilters = () => {
    setTimePeriod('month');
    setCategoryIds([]);
    setSearchQuery('');
  };

  const transactionFilter: TransactionFilter = useMemo(() => {
    const bounds = getPeriodBounds(timePeriod);
    return {
      startDate: bounds?.start,
      endDate: bounds?.end,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      searchQuery: searchQuery || undefined,
    };
  }, [timePeriod, categoryIds, searchQuery]);

  return {
    timePeriod,
    setTimePeriod,
    categoryIds,
    setCategoryIds,
    toggleCategory,
    clearCategories,
    searchQuery,
    setSearchQuery,
    resetFilters,
    transactionFilter,
  };
}
