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

// Canonical field name → known localized column headers
const COLUMN_ALIASES: Record<string, string[]> = {
  type: ['Type', 'Tipo', 'Art', 'Genre', 'Typ'],
  product: ['Product', 'Producto', 'Produit', 'Produkt', 'Prodotto'],
  startedDate: [
    'Started Date', 'Fecha de inicio', 'Date de début',
    'Startdatum', 'Data di inizio', 'Data de início',
  ],
  completedDate: [
    'Completed Date', 'Fecha de finalización', 'Fecha de finalizacion',
    'Date de fin', 'Abschlussdatum', 'Data di completamento', 'Data de conclusão',
  ],
  description: ['Description', 'Descripción', 'Descripcion', 'Beschreibung', 'Descrizione', 'Descrição'],
  amount: ['Amount', 'Importe', 'Montant', 'Betrag', 'Importo', 'Valor'],
  fee: ['Fee', 'Comisión', 'Comision', 'Frais', 'Gebühr', 'Gebuhr', 'Commissione', 'Taxa'],
  currency: ['Currency', 'Divisa', 'Devise', 'Währung', 'Wahrung', 'Valuta', 'Moeda'],
  state: ['State', 'Estado', 'État', 'Etat', 'Status', 'Stato'],
  balance: ['Balance', 'Saldo', 'Solde', 'Kontostand', 'Saldo'],
};

// Required canonical fields
const REQUIRED_FIELDS = ['type', 'startedDate', 'description', 'amount', 'currency'];

/**
 * Build a mapping from canonical field names to the actual CSV column header,
 * using a case-insensitive + accent-normalized match.
 */
function buildColumnMap(headers: string[]): Record<string, string> | null {
  const map: Record<string, string> = {};
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const normalizedHeaders = headers.map(h => ({ original: h, norm: normalize(h) }));

  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const match = normalizedHeaders.find(h => h.norm === normalize(alias));
      if (match) {
        map[canonical] = match.original;
        break;
      }
    }
  }

  // Check required fields
  const missing = REQUIRED_FIELDS.filter(f => !map[f]);
  if (missing.length > 0) return null;

  return map;
}

function parseAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  // Handle European format: "1.234,56" → "1234.56"
  const trimmed = raw.trim();
  // If there's both . and , → determine which is decimal separator
  if (trimmed.includes(',') && trimmed.includes('.')) {
    if (trimmed.lastIndexOf(',') > trimmed.lastIndexOf('.')) {
      // 1.234,56 → European
      return parseFloat(trimmed.replace(/\./g, '').replace(',', '.')) || 0;
    }
    // 1,234.56 → US
    return parseFloat(trimmed.replace(/,/g, '')) || 0;
  }
  // Only comma → treat as decimal
  const cleaned = trimmed.replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
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
  } catch { /* try next */ }

  // Try "dd/MM/yyyy" (no time)
  try {
    const parsed = parseDate(trimmed, 'dd/MM/yyyy', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch { /* fallback */ }

  return new Date();
}

function getField(row: RawRevolutRow, colMap: Record<string, string>, field: string): string {
  const header = colMap[field];
  if (!header) return '';
  return (row[header] ?? '').trim();
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

        // Auto-detect columns
        const headers = results.meta.fields ?? [];
        const colMap = buildColumnMap(headers);

        if (!colMap) {
          const missing = REQUIRED_FIELDS.filter(f => {
            const aliases = COLUMN_ALIASES[f] ?? [];
            const normalize = (s: string) =>
              s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            const normalizedHeaders = headers.map(h => normalize(h));
            return !aliases.some(a => normalizedHeaders.includes(normalize(a)));
          });
          resolve({
            transactions: [],
            errors: [{
              row: 0,
              message: `Could not match required columns: ${missing.join(', ')}.\n\nFound columns: ${headers.join(', ')}`,
            }],
            duplicateCount: 0,
            totalRows: 0,
          });
          return;
        }

        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i];

          try {
            const amount = parseAmount(getField(row, colMap, 'amount'));
            const startedDate = parseRevolutDate(getField(row, colMap, 'startedDate'));
            const description = getField(row, colMap, 'description');

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

            const completedDateRaw = getField(row, colMap, 'completedDate');
            const completedDate = completedDateRaw
              ? parseRevolutDate(completedDateRaw)
              : startedDate;

            const transaction: Transaction = {
              id: crypto.randomUUID(),
              type: parseTransactionType(getField(row, colMap, 'type')),
              product: getField(row, colMap, 'product'),
              startedDate,
              completedDate,
              description,
              amount,
              fee: parseAmount(getField(row, colMap, 'fee')),
              currency: (getField(row, colMap, 'currency') || 'EUR').toUpperCase(),
              state: parseTransactionState(getField(row, colMap, 'state') || 'COMPLETED'),
              balance: parseAmount(getField(row, colMap, 'balance')),
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
