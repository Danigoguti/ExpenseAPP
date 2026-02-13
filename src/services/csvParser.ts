import Papa from 'papaparse';
import { parse as parseDate } from 'date-fns';
import type { RawRevolutRow, Transaction } from '../models/Transaction';
import { parseTransactionType, parseTransactionState } from '../models/Transaction';

export interface ParseError {
  row: number;
  message: string;
}

export interface ParseResult {
  transactions: Transaction[];
  errors: ParseError[];
  duplicateCount: number;
  totalRows: number;
}

const REQUIRED_COLUMNS = ['Type', 'Started Date', 'Description', 'Amount', 'Currency'];

function parseAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  const cleaned = raw.trim().replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function parseRevolutDate(raw: string): Date {
  if (!raw || raw.trim() === '') return new Date();
  const trimmed = raw.trim();

  // Try the standard Revolut format: "2024-03-15 14:22:10"
  try {
    const parsed = parseDate(trimmed, 'yyyy-MM-dd HH:mm:ss', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch { /* try next format */ }

  // Try ISO format
  const iso = new Date(trimmed);
  if (!isNaN(iso.getTime())) return iso;

  // Try "dd/MM/yyyy HH:mm:ss" format
  try {
    const parsed = parseDate(trimmed, 'dd/MM/yyyy HH:mm:ss', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch { /* fallback */ }

  return new Date();
}

export function getFingerprint(description: string, amount: number, startedDate: Date): string {
  return `${description}|${amount}|${startedDate.toISOString()}`;
}

export async function parseRevolutCSV(
  file: File,
  existingFingerprints: Set<string> = new Set(),
): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<RawRevolutRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        const errors: ParseError[] = [];
        const transactions: Transaction[] = [];
        let duplicateCount = 0;
        const batchId = crypto.randomUUID();
        const now = new Date();

        // Validate required columns
        const headers = results.meta.fields ?? [];
        const missingCols = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
        if (missingCols.length > 0) {
          resolve({
            transactions: [],
            errors: [{ row: 0, message: `Missing required columns: ${missingCols.join(', ')}` }],
            duplicateCount: 0,
            totalRows: 0,
          });
          return;
        }

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i];

          try {
            const amount = parseAmount(row.Amount);
            const startedDate = parseRevolutDate(row['Started Date']);
            const description = (row.Description ?? '').trim();

            if (!description && amount === 0) {
              continue; // Skip empty rows
            }

            // Check for duplicates
            const fingerprint = getFingerprint(description, amount, startedDate);
            if (existingFingerprints.has(fingerprint)) {
              duplicateCount++;
              continue;
            }
            existingFingerprints.add(fingerprint);

            const completedDate = row['Completed Date']
              ? parseRevolutDate(row['Completed Date'])
              : startedDate;

            const transaction: Transaction = {
              id: crypto.randomUUID(),
              type: parseTransactionType(row.Type ?? ''),
              product: (row.Product ?? '').trim(),
              startedDate,
              completedDate,
              description,
              amount,
              fee: parseAmount(row.Fee),
              currency: (row.Currency ?? 'EUR').trim().toUpperCase(),
              state: parseTransactionState(row.State ?? 'COMPLETED'),
              balance: parseAmount(row.Balance),
              categoryId: null,
              importedAt: now,
              importBatchId: batchId,
            };

            transactions.push(transaction);
          } catch (err) {
            errors.push({
              row: i + 1,
              message: err instanceof Error ? err.message : 'Unknown parse error',
            });
          }
        }

        resolve({
          transactions,
          errors,
          duplicateCount,
          totalRows: results.data.length,
        });
      },
      error: (error: Error) => {
        resolve({
          transactions: [],
          errors: [{ row: 0, message: error.message }],
          duplicateCount: 0,
          totalRows: 0,
        });
      },
    });
  });
}
