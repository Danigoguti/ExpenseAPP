export interface RawRevolutRow {
  Type: string;
  Product: string;
  'Started Date': string;
  'Completed Date': string;
  Description: string;
  Amount: string;
  Fee: string;
  Currency: string;
  State: string;
  Balance: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  product: string;
  startedDate: Date;
  completedDate: Date;
  description: string;
  amount: number;
  fee: number;
  currency: string;
  state: TransactionState;
  balance: number;
  categoryId: string | null;
  importedAt: Date;
  importBatchId: string;
}

export type TransactionType =
  | 'CARD_PAYMENT'
  | 'TOPUP'
  | 'TRANSFER'
  | 'EXCHANGE'
  | 'ATM'
  | 'REWARD'
  | 'FEE'
  | 'OTHER';

export type TransactionState =
  | 'COMPLETED'
  | 'PENDING'
  | 'REVERTED'
  | 'DECLINED'
  | 'FAILED';

const VALID_TYPES: Set<string> = new Set([
  'CARD_PAYMENT', 'TOPUP', 'TRANSFER', 'EXCHANGE', 'ATM', 'REWARD', 'FEE',
]);

const VALID_STATES: Set<string> = new Set([
  'COMPLETED', 'PENDING', 'REVERTED', 'DECLINED', 'FAILED',
]);

export function parseTransactionType(raw: string): TransactionType {
  const upper = raw.trim().toUpperCase().replace(/\s+/g, '_');
  return VALID_TYPES.has(upper) ? (upper as TransactionType) : 'OTHER';
}

export function parseTransactionState(raw: string): TransactionState {
  const upper = raw.trim().toUpperCase();
  return VALID_STATES.has(upper) ? (upper as TransactionState) : 'COMPLETED';
}
