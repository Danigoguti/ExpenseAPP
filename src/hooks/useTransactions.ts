import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Transaction } from '../models/Transaction';

export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  searchQuery?: string;
}

export function useTransactions(filter?: TransactionFilter) {
  const transactions = useLiveQuery(async () => {
    let collection = db.transactions.orderBy('startedDate').reverse();

    let results = await collection.toArray();

    if (filter?.startDate) {
      const start = filter.startDate;
      results = results.filter(t => t.startedDate >= start);
    }
    if (filter?.endDate) {
      const end = filter.endDate;
      results = results.filter(t => t.startedDate <= end);
    }
    if (filter?.categoryIds && filter.categoryIds.length > 0) {
      const ids = new Set(filter.categoryIds);
      results = results.filter(t => t.categoryId && ids.has(t.categoryId));
    }
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      results = results.filter(t => t.description.toLowerCase().includes(q));
    }

    return results;
  }, [filter?.startDate, filter?.endDate, filter?.categoryIds, filter?.searchQuery]) ?? [];

  const addTransactions = async (txns: Transaction[]) => {
    await db.transactions.bulkAdd(txns);
  };

  const updateCategory = async (txnId: string, categoryId: string) => {
    await db.transactions.update(txnId, { categoryId });
  };

  const bulkUpdateCategory = async (txnIds: string[], categoryId: string) => {
    await db.transaction('rw', db.transactions, async () => {
      for (const id of txnIds) {
        await db.transactions.update(id, { categoryId });
      }
    });
  };

  const getExistingFingerprints = async (): Promise<Set<string>> => {
    const all = await db.transactions.toArray();
    return new Set(all.map(t => `${t.description}|${t.amount}|${t.startedDate.toISOString()}`));
  };

  const transactionCount = useLiveQuery(() => db.transactions.count()) ?? 0;

  return {
    transactions,
    transactionCount,
    addTransactions,
    updateCategory,
    bulkUpdateCategory,
    getExistingFingerprints,
  };
}
