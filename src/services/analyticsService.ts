import { format, startOfDay, differenceInDays, differenceInWeeks, differenceInMonths } from 'date-fns';
import type { Transaction } from '../models/Transaction';
import type { Category } from '../models/Category';

export interface CategorySlice {
  categoryId: string | null;
  categoryName: string;
  color: string;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlyTotal {
  month: string; // "Jan", "Feb", etc.
  monthKey: string; // "2024-03"
  total: number;
}

export interface DailyTotal {
  date: string;
  dateKey: string;
  total: number;
}

export interface TrendPoint {
  date: string;
  dateKey: string;
  amount: number;
  cumulative: number;
}

export interface SummaryStats {
  totalSpent: number;
  totalIncome: number;
  netChange: number;
  avgPerDay: number;
  avgPerWeek: number;
  avgPerMonth: number;
  transactionCount: number;
  topCategory: { name: string; total: number; color: string } | null;
  periodStart: Date | null;
  periodEnd: Date | null;
}

function getExpenses(txns: Transaction[]): Transaction[] {
  return txns.filter(t => t.amount < 0 && t.state === 'COMPLETED');
}

function getIncome(txns: Transaction[]): Transaction[] {
  return txns.filter(t => t.amount > 0 && t.state === 'COMPLETED');
}

export function getCategoryBreakdown(
  txns: Transaction[],
  categories: Category[],
): CategorySlice[] {
  const expenses = getExpenses(txns);
  const catMap = new Map(categories.map(c => [c.id, c]));
  const groups = new Map<string | null, { total: number; count: number }>();

  for (const txn of expenses) {
    const key = txn.categoryId;
    const existing = groups.get(key) ?? { total: 0, count: 0 };
    existing.total += Math.abs(txn.amount);
    existing.count += 1;
    groups.set(key, existing);
  }

  const totalSpent = Array.from(groups.values()).reduce((s, g) => s + g.total, 0);

  const slices: CategorySlice[] = Array.from(groups.entries()).map(([catId, data]) => {
    const cat = catId ? catMap.get(catId) : undefined;
    return {
      categoryId: catId,
      categoryName: cat?.name ?? 'Uncategorized',
      color: cat?.color ?? '#475569',
      total: data.total,
      percentage: totalSpent > 0 ? (data.total / totalSpent) * 100 : 0,
      count: data.count,
    };
  });

  return slices.sort((a, b) => b.total - a.total);
}

export function getMonthlyTotals(txns: Transaction[]): MonthlyTotal[] {
  const expenses = getExpenses(txns);
  const groups = new Map<string, number>();

  for (const txn of expenses) {
    const key = format(txn.startedDate, 'yyyy-MM');
    groups.set(key, (groups.get(key) ?? 0) + Math.abs(txn.amount));
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return {
        month: format(date, 'MMM'),
        monthKey: key,
        total,
      };
    });
}

export function getDailyTotals(txns: Transaction[]): DailyTotal[] {
  const expenses = getExpenses(txns);
  const groups = new Map<string, number>();

  for (const txn of expenses) {
    const key = format(txn.startedDate, 'yyyy-MM-dd');
    groups.set(key, (groups.get(key) ?? 0) + Math.abs(txn.amount));
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({
      date: format(new Date(key), 'MMM d'),
      dateKey: key,
      total,
    }));
}

export function getSpendingTrend(txns: Transaction[]): TrendPoint[] {
  const dailyTotals = getDailyTotals(txns);
  let cumulative = 0;

  return dailyTotals.map(d => {
    cumulative += d.total;
    return {
      date: d.date,
      dateKey: d.dateKey,
      amount: d.total,
      cumulative,
    };
  });
}

export function getSummaryStats(
  txns: Transaction[],
  categories: Category[],
): SummaryStats {
  const expenses = getExpenses(txns);
  const income = getIncome(txns);

  const totalSpent = expenses.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);

  const dates = expenses.map(t => t.startedDate);
  const periodStart = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
  const periodEnd = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

  let avgPerDay = 0;
  let avgPerWeek = 0;
  let avgPerMonth = 0;

  if (periodStart && periodEnd) {
    const days = Math.max(1, differenceInDays(periodEnd, periodStart) + 1);
    const weeks = Math.max(1, differenceInWeeks(periodEnd, periodStart) + 1);
    const months = Math.max(1, differenceInMonths(periodEnd, periodStart) + 1);
    avgPerDay = totalSpent / days;
    avgPerWeek = totalSpent / weeks;
    avgPerMonth = totalSpent / months;
  }

  // Top category
  const breakdown = getCategoryBreakdown(txns, categories);
  const top = breakdown.length > 0 ? breakdown[0] : null;

  return {
    totalSpent,
    totalIncome,
    netChange: totalIncome - totalSpent,
    avgPerDay,
    avgPerWeek,
    avgPerMonth,
    transactionCount: expenses.length,
    topCategory: top ? { name: top.categoryName, total: top.total, color: top.color } : null,
    periodStart: periodStart ? startOfDay(periodStart) : null,
    periodEnd,
  };
}
