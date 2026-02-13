import Dexie, { type Table } from 'dexie';
import type { Transaction } from '../models/Transaction';
import type { Category } from '../models/Category';
import type { CategoryRule } from '../models/CategoryRule';
import { DEFAULT_CATEGORIES } from '../models/Category';
import { DEFAULT_RULE_SEEDS } from '../models/CategoryRule';

class ExpenseDB extends Dexie {
  transactions!: Table<Transaction, string>;
  categories!: Table<Category, string>;
  categoryRules!: Table<CategoryRule, string>;

  constructor() {
    super('ExpenseTrackerDB');

    this.version(1).stores({
      transactions: 'id, startedDate, completedDate, categoryId, type, state, currency, importBatchId, [categoryId+startedDate]',
      categories: 'id, name, isDefault',
      categoryRules: 'id, categoryId, priority, source',
    });

    this.on('populate', async () => {
      const categoryMap = new Map<string, string>();

      for (const cat of DEFAULT_CATEGORIES) {
        const id = crypto.randomUUID();
        categoryMap.set(cat.name, id);
        await this.categories.add({ ...cat, id });
      }

      for (const seed of DEFAULT_RULE_SEEDS) {
        const categoryId = categoryMap.get(seed.categoryName);
        if (categoryId) {
          await this.categoryRules.add({
            id: crypto.randomUUID(),
            pattern: seed.pattern,
            categoryId,
            isRegex: false,
            priority: seed.priority,
            source: 'default',
          });
        }
      }
    });
  }
}

export const db = new ExpenseDB();
