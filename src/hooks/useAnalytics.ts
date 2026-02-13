import { useMemo } from 'react';
import type { Transaction } from '../models/Transaction';
import type { Category } from '../models/Category';
import {
  getCategoryBreakdown,
  getMonthlyTotals,
  getSpendingTrend,
  getSummaryStats,
  type CategorySlice,
  type MonthlyTotal,
  type TrendPoint,
  type SummaryStats,
} from '../services/analyticsService';

interface AnalyticsData {
  summary: SummaryStats;
  categoryBreakdown: CategorySlice[];
  monthlyTotals: MonthlyTotal[];
  spendingTrend: TrendPoint[];
}

export function useAnalytics(transactions: Transaction[], categories: Category[]): AnalyticsData {
  return useMemo(() => ({
    summary: getSummaryStats(transactions, categories),
    categoryBreakdown: getCategoryBreakdown(transactions, categories),
    monthlyTotals: getMonthlyTotals(transactions),
    spendingTrend: getSpendingTrend(transactions),
  }), [transactions, categories]);
}
