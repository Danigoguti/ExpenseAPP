import { db } from '../db';
import type { CategoryRule } from '../models/CategoryRule';
import type { Transaction } from '../models/Transaction';

export function suggestCategory(
  description: string,
  rules: CategoryRule[],
): string | null {
  const lower = description.toLowerCase();
  const sorted = [...rules].sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    if (rule.isRegex) {
      try {
        if (new RegExp(rule.pattern, 'i').test(description)) {
          return rule.categoryId;
        }
      } catch {
        continue;
      }
    } else {
      if (lower.includes(rule.pattern.toLowerCase())) {
        return rule.categoryId;
      }
    }
  }

  return null;
}

export function extractMerchantKeyword(description: string): string {
  let cleaned = description
    .replace(/^(payment to|transfer to|payment from|transfer from)\s+/i, '')
    .replace(/\s*(ltd|inc|llc|gmbh|s\.?a\.?|s\.?l\.?|s\.?r\.?l\.?)\s*$/i, '')
    .trim();

  // Take the first 3 meaningful words
  const words = cleaned.split(/\s+/).slice(0, 3).join(' ');
  return words || cleaned;
}

export async function learnFromAssignment(
  description: string,
  categoryId: string,
): Promise<void> {
  const keyword = extractMerchantKeyword(description);
  if (keyword.length < 2) return;

  // Check if a similar rule already exists
  const existing = await db.categoryRules
    .where('categoryId')
    .equals(categoryId)
    .toArray();

  const alreadyExists = existing.some(
    r => r.pattern.toLowerCase() === keyword.toLowerCase(),
  );

  if (!alreadyExists) {
    await db.categoryRules.add({
      id: crypto.randomUUID(),
      pattern: keyword,
      categoryId,
      isRegex: false,
      priority: 20, // Higher than defaults (5-10)
      source: 'user',
    });
  }
}

export async function autoClassifyTransactions(
  transactions: Transaction[],
): Promise<Transaction[]> {
  const rules = await db.categoryRules.toArray();

  return transactions.map(txn => {
    if (txn.categoryId) return txn;
    const suggested = suggestCategory(txn.description, rules);
    return suggested ? { ...txn, categoryId: suggested } : txn;
  });
}

export async function findSimilarTransactions(
  description: string,
): Promise<Transaction[]> {
  const keyword = extractMerchantKeyword(description).toLowerCase();
  if (keyword.length < 2) return [];

  const all = await db.transactions.toArray();
  return all.filter(t => t.description.toLowerCase().includes(keyword));
}
