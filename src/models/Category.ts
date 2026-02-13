export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault: boolean;
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Food & Dining',     icon: 'utensils',       color: '#F59E0B', isDefault: true },
  { name: 'Transport',         icon: 'car',            color: '#3B82F6', isDefault: true },
  { name: 'Entertainment',     icon: 'film',           color: '#8B5CF6', isDefault: true },
  { name: 'Shopping',          icon: 'shopping-bag',   color: '#EC4899', isDefault: true },
  { name: 'Bills & Utilities', icon: 'receipt',        color: '#EF4444', isDefault: true },
  { name: 'Health',            icon: 'heart-pulse',    color: '#10B981', isDefault: true },
  { name: 'Groceries',         icon: 'shopping-cart',  color: '#06B6D4', isDefault: true },
  { name: 'Subscriptions',     icon: 'repeat',         color: '#6366F1', isDefault: true },
  { name: 'Travel',            icon: 'plane',          color: '#F97316', isDefault: true },
  { name: 'Education',         icon: 'graduation-cap', color: '#14B8A6', isDefault: true },
  { name: 'Income',            icon: 'trending-up',    color: '#22C55E', isDefault: true },
  { name: 'Other',             icon: 'circle-dot',     color: '#6B7280', isDefault: true },
];
