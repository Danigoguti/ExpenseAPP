import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Category } from '../models/Category';

export function useCategories() {
  const categories = useLiveQuery(() => db.categories.toArray()) ?? [];

  const getCategoryById = (id: string | null): Category | undefined => {
    if (!id) return undefined;
    return categories.find(c => c.id === id);
  };

  const getCategoryMap = (): Map<string, Category> => {
    return new Map(categories.map(c => [c.id, c]));
  };

  const addCategory = async (cat: Omit<Category, 'id'>) => {
    const id = crypto.randomUUID();
    await db.categories.add({ ...cat, id });
    return id;
  };

  return { categories, getCategoryById, getCategoryMap, addCategory };
}
