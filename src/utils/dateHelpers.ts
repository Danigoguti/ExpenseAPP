import {
  startOfDay, endOfDay,
  startOfWeek, endOfWeek,
  startOfMonth, endOfMonth,
  startOfYear, endOfYear,
} from 'date-fns';

export type TimePeriod = 'day' | 'week' | 'month' | 'year' | 'all';

export interface DateRange {
  start: Date;
  end: Date;
}

export function getPeriodBounds(period: TimePeriod, referenceDate: Date = new Date()): DateRange | null {
  switch (period) {
    case 'day':
      return { start: startOfDay(referenceDate), end: endOfDay(referenceDate) };
    case 'week':
      return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfWeek(referenceDate, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    case 'year':
      return { start: startOfYear(referenceDate), end: endOfYear(referenceDate) };
    case 'all':
      return null;
  }
}
