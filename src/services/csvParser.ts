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
  balance: ['Balance', 'Saldo', 'Solde', 'Kontostand'],
};

// Required canonical fields
const REQUIRED_FIELDS = ['type', 'startedDate', 'description', 'amount', 'currency'];

/**
 * Normalize a string for fuzzy header matching:
 * lowercase, strip accents/diacritics, and collapse whitespace.
 */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Build a mapping from canonical field names to the actual CSV column header.
 */
function buildColumnMap(headers: string[]): Record<string, string> | null {
  const map: Record<string, string> = {};
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

  const missing = REQUIRED_FIELDS.filter(f => !map[f]);
  if (missing.length > 0) return null;

  return map;
}

function parseAmount(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  const trimmed = raw.trim();
  if (trimmed.includes(',') && trimmed.includes('.')) {
    if (trimmed.lastIndexOf(',') > trimmed.lastIndexOf('.')) {
      return parseFloat(trimmed.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return parseFloat(trimmed.replace(/,/g, '')) || 0;
  }
  const cleaned = trimmed.replace(/,/g, '.');
  return parseFloat(cleaned) || 0;
}

function parseRevolutDate(raw: string): Date {
  if (!raw || raw.trim() === '') return new Date();
  const trimmed = raw.trim();

  try {
    const parsed = parseDate(trimmed, 'yyyy-MM-dd HH:mm:ss', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch { /* try next format */ }

  const iso = new Date(trimmed);
  if (!isNaN(iso.getTime())) return iso;

  try {
    const parsed = parseDate(trimmed, 'dd/MM/yyyy HH:mm:ss', new Date());
    if (!isNaN(parsed.getTime())) return parsed;
  } catch { /* try next */ }

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

/**
 * Read a File as text with a specific encoding.
 */
function readFileAs(file: File, encoding: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, encoding);
  });
}

/**
 * Parse CSV text string and transform rows into transactions.
 */
function parseCSVText(
  text: string,
  existingFingerprints: Set<string>,
): ParseResult {
  const parsed = Papa.parse<RawRevolutRow>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const errors: ParseError[] = [];
  const transactions: Transaction[] = [];
  let duplicateCount = 0;
  const batchId = crypto.randomUUID();
  const now = new Date();

  const headers = parsed.meta.fields ?? [];
  const colMap = buildColumnMap(headers);

  if (!colMap) {
    const missing = REQUIRED_FIELDS.filter(f => {
      const aliases = COLUMN_ALIASES[f] ?? [];
      const normalizedHeaders = headers.map(h => normalize(h));
      return !aliases.some(a => normalizedHeaders.includes(normalize(a)));
    });
    return {
      transactions: [],
      errors: [{
        row: 0,
        message: `Could not match required columns: ${missing.join(', ')}. Found columns: ${headers.join(', ')}`,
      }],
      duplicateCount: 0,
      totalRows: 0,
    };
  }

  for (let i = 0; i < parsed.data.length; i++) {
    const row = parsed.data[i];

    try {
      const amount = parseAmount(getField(row, colMap, 'amount'));
      const startedDate = parseRevolutDate(getField(row, colMap, 'startedDate'));
      const description = getField(row, colMap, 'description');

      if (!description && amount === 0) {
        continue;
      }

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

  return {
    transactions,
    errors,
    duplicateCount,
    totalRows: parsed.data.length,
  };
}

// Encodings to try, in order of preference
const ENCODINGS = ['UTF-8', 'windows-1252', 'ISO-8859-1'];

export async function parseRevolutCSV(
  file: File,
  existingFingerprints: Set<string> = new Set(),
): Promise<ParseResult> {
  let lastResult: ParseResult | null = null;

  for (const encoding of ENCODINGS) {
    try {
      const text = await readFileAs(file, encoding);
      // Clone fingerprints so failed attempts don't pollute the set
      const fpCopy = new Set(existingFingerprints);
      const result = parseCSVText(text, fpCopy);

      // If columns matched (no column-level errors), use this result
      const hasColumnError = result.errors.some(e =>
        e.row === 0 && e.message.includes('Could not match'),
      );

      if (!hasColumnError) {
        // Copy successfully used fingerprints back
        for (const fp of fpCopy) existingFingerprints.add(fp);
        return result;
      }

      lastResult = result;
    } catch {
      // Encoding read failed, try next
    }
  }

  return lastResult ?? {
    transactions: [],
    errors: [{ row: 0, message: 'Failed to read the CSV file. Please check the file format and encoding.' }],
    duplicateCount: 0,
    totalRows: 0,
  };
}
