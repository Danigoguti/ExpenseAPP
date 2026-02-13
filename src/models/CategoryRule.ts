export interface CategoryRule {
  id: string;
  pattern: string;
  categoryId: string;
  isRegex: boolean;
  priority: number;
  source: 'default' | 'user';
}

export interface DefaultRuleSeed {
  pattern: string;
  categoryName: string;
  priority: number;
}

export const DEFAULT_RULE_SEEDS: DefaultRuleSeed[] = [
  // Food & Dining
  { pattern: 'uber eats',       categoryName: 'Food & Dining', priority: 10 },
  { pattern: 'deliveroo',       categoryName: 'Food & Dining', priority: 10 },
  { pattern: 'just eat',        categoryName: 'Food & Dining', priority: 10 },
  { pattern: 'glovo',           categoryName: 'Food & Dining', priority: 10 },
  { pattern: 'mcdonald',        categoryName: 'Food & Dining', priority: 10 },
  { pattern: 'burger king',     categoryName: 'Food & Dining', priority: 10 },
  { pattern: 'starbucks',       categoryName: 'Food & Dining', priority: 10 },
  { pattern: 'restaurant',      categoryName: 'Food & Dining', priority: 5 },
  { pattern: 'cafe',            categoryName: 'Food & Dining', priority: 5 },
  // Transport
  { pattern: 'uber',            categoryName: 'Transport', priority: 8 },
  { pattern: 'bolt',            categoryName: 'Transport', priority: 8 },
  { pattern: 'cabify',          categoryName: 'Transport', priority: 10 },
  { pattern: 'tfl',             categoryName: 'Transport', priority: 10 },
  { pattern: 'metro',           categoryName: 'Transport', priority: 5 },
  { pattern: 'parking',         categoryName: 'Transport', priority: 5 },
  { pattern: 'fuel',            categoryName: 'Transport', priority: 5 },
  { pattern: 'gas station',     categoryName: 'Transport', priority: 8 },
  // Shopping
  { pattern: 'amazon',          categoryName: 'Shopping', priority: 8 },
  { pattern: 'zara',            categoryName: 'Shopping', priority: 10 },
  { pattern: 'h&m',             categoryName: 'Shopping', priority: 10 },
  { pattern: 'ikea',            categoryName: 'Shopping', priority: 10 },
  { pattern: 'aliexpress',      categoryName: 'Shopping', priority: 10 },
  // Subscriptions
  { pattern: 'netflix',         categoryName: 'Subscriptions', priority: 10 },
  { pattern: 'spotify',         categoryName: 'Subscriptions', priority: 10 },
  { pattern: 'apple.com/bill',  categoryName: 'Subscriptions', priority: 10 },
  { pattern: 'hbo',             categoryName: 'Subscriptions', priority: 10 },
  { pattern: 'disney+',         categoryName: 'Subscriptions', priority: 10 },
  { pattern: 'youtube',         categoryName: 'Subscriptions', priority: 8 },
  { pattern: 'chatgpt',         categoryName: 'Subscriptions', priority: 10 },
  // Groceries
  { pattern: 'lidl',            categoryName: 'Groceries', priority: 10 },
  { pattern: 'aldi',            categoryName: 'Groceries', priority: 10 },
  { pattern: 'tesco',           categoryName: 'Groceries', priority: 10 },
  { pattern: 'carrefour',       categoryName: 'Groceries', priority: 10 },
  { pattern: 'mercadona',       categoryName: 'Groceries', priority: 10 },
  { pattern: 'supermarket',     categoryName: 'Groceries', priority: 5 },
  // Bills & Utilities
  { pattern: 'electricity',     categoryName: 'Bills & Utilities', priority: 8 },
  { pattern: 'water bill',      categoryName: 'Bills & Utilities', priority: 8 },
  { pattern: 'internet',        categoryName: 'Bills & Utilities', priority: 5 },
  { pattern: 'vodafone',        categoryName: 'Bills & Utilities', priority: 10 },
  { pattern: 'movistar',        categoryName: 'Bills & Utilities', priority: 10 },
  // Health
  { pattern: 'pharmacy',        categoryName: 'Health', priority: 8 },
  { pattern: 'farmacia',        categoryName: 'Health', priority: 8 },
  { pattern: 'doctor',          categoryName: 'Health', priority: 5 },
  { pattern: 'hospital',        categoryName: 'Health', priority: 8 },
  // Travel
  { pattern: 'ryanair',         categoryName: 'Travel', priority: 10 },
  { pattern: 'booking.com',     categoryName: 'Travel', priority: 10 },
  { pattern: 'airbnb',          categoryName: 'Travel', priority: 10 },
  { pattern: 'hotel',           categoryName: 'Travel', priority: 5 },
  // Education
  { pattern: 'udemy',           categoryName: 'Education', priority: 10 },
  { pattern: 'coursera',        categoryName: 'Education', priority: 10 },
];
