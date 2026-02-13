import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import type { ParseResult, ParseError } from './csvParser';
import type { Transaction } from '../models/Transaction';
import { getFingerprint } from './csvParser';

// Configure pdf.js worker
GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).href;

// --- Month name mapping (Spanish + English short forms) ---
const MONTH_MAP: Record<string, number> = {
  ene: 0, jan: 0,
  feb: 1,
  mar: 2,
  abr: 3, apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7, aug: 7,
  sep: 8, sept: 8,
  oct: 9,
  nov: 10,
  dic: 11, dec: 11,
};

// Date pattern: "31 ene 2026" or "1 feb 2026"
const DATE_RE = /^(\d{1,2})\s+([a-záéíóú]+)\s+(\d{4})$/i;

// Amount pattern: "€15.00" or "€1,550.00" or just "15.00"
const AMOUNT_RE = /€?\s*([\d.,]+)/;

// --- Types ---
interface PdfItem {
  str: string;
  x: number;
  y: number;
}

interface PdfRow {
  y: number;
  items: PdfItem[];
}

interface ColumnBounds {
  dateCol: number;
  valueDateCol: number;
  descCol: number;
  outCol: number;
  inCol: number;
  balanceCol: number;
}

interface RawPdfTransaction {
  transactionDate: string;
  valueDate: string;
  description: string;
  moneyOut: string;
  moneyIn: string;
  balance: string;
}

// --- Header detection keywords by language ---
const HEADER_KEYWORDS = [
  // Spanish
  'fecha de la transacción', 'fecha de la transaccion', 'fecha valor',
  'dinero saliente', 'dinero entrante',
  // English
  'transaction date', 'value date', 'money out', 'money in',
  'completed date', 'paid out', 'paid in',
  // French
  'date de transaction', 'date de valeur', 'débit', 'crédit',
  // German
  'transaktionsdatum', 'wertstellungsdatum', 'ausgaben', 'einnahmen',
];

// --- Extraction ---

async function extractTextItems(file: File): Promise<PdfItem[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: buffer }).promise;
  const allItems: PdfItem[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (!('str' in item) || typeof item.str !== 'string') continue;
      const str = item.str.trim();
      if (!str) continue;

      // transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const transform = item.transform as number[];
      allItems.push({
        str,
        x: Math.round(transform[4]),
        // Prefix pageNum to y so pages sort correctly (higher page = lower position)
        y: pageNum * 100000 - Math.round(transform[5]),
      });
    }
  }

  return allItems;
}

function groupIntoRows(items: PdfItem[], tolerance = 3): PdfRow[] {
  if (items.length === 0) return [];

  // Sort by y (top to bottom), then x (left to right)
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);

  const rows: PdfRow[] = [];
  let currentRow: PdfItem[] = [sorted[0]];
  let currentY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    const item = sorted[i];
    if (Math.abs(item.y - currentY) <= tolerance) {
      currentRow.push(item);
    } else {
      rows.push({ y: currentY, items: currentRow });
      currentRow = [item];
      currentY = item.y;
    }
  }
  rows.push({ y: currentY, items: currentRow });

  return rows;
}

function isHeaderRow(row: PdfRow): boolean {
  const text = row.items.map(i => i.str).join(' ').toLowerCase();
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return HEADER_KEYWORDS.some(kw => {
    const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized.includes(kwNorm);
  });
}

function detectColumns(headerRows: PdfRow[]): ColumnBounds | null {
  // Collect all header items across header rows
  const allItems = headerRows.flatMap(r => r.items);
  const fullText = allItems.map(i => i.str.toLowerCase()).join(' ');

  // We need at least description and one amount column
  const descItem = allItems.find(i => {
    const t = i.str.toLowerCase();
    return t.includes('descrip') || t.includes('description') || t.includes('beschreibung');
  });
  if (!descItem) return null;

  // Find amount columns by looking for money/amount keywords or position
  const outItem = allItems.find(i => {
    const t = i.str.toLowerCase();
    return t.includes('saliente') || t.includes('out') || t.includes('débit')
      || t.includes('ausgaben') || t.includes('paid out');
  });

  const inItem = allItems.find(i => {
    const t = i.str.toLowerCase();
    return t.includes('entrante') || t.includes(' in') || t.includes('crédit')
      || t.includes('einnahmen') || t.includes('paid in');
  });

  const balItem = allItems.find(i => {
    const t = i.str.toLowerCase();
    return t.includes('saldo') || t.includes('balance') || t.includes('solde')
      || t.includes('kontostand');
  });

  // Find date columns
  const dateItems = allItems.filter(i => {
    const t = i.str.toLowerCase();
    return t.includes('fecha') || t.includes('date') || t.includes('datum');
  });
  const sortedDates = dateItems.sort((a, b) => a.x - b.x);

  // Determine if this looks like a Revolut statement
  if (!fullText.includes('fecha') && !fullText.includes('date') && !fullText.includes('datum')) {
    return null;
  }

  return {
    dateCol: sortedDates[0]?.x ?? 0,
    valueDateCol: sortedDates[1]?.x ?? sortedDates[0]?.x ?? 0,
    descCol: descItem.x,
    outCol: outItem?.x ?? 0,
    inCol: inItem?.x ?? 0,
    balanceCol: balItem?.x ?? 0,
  };
}

function assignToColumn(itemX: number, cols: ColumnBounds): string {
  // Find which column this x position is closest to
  const positions = [
    { name: 'date', x: cols.dateCol },
    { name: 'valueDate', x: cols.valueDateCol },
    { name: 'desc', x: cols.descCol },
    { name: 'out', x: cols.outCol },
    { name: 'in', x: cols.inCol },
    { name: 'balance', x: cols.balanceCol },
  ].filter(p => p.x > 0);

  let closest = positions[0];
  let minDist = Math.abs(itemX - positions[0].x);

  for (let i = 1; i < positions.length; i++) {
    const dist = Math.abs(itemX - positions[i].x);
    if (dist < minDist) {
      minDist = dist;
      closest = positions[i];
    }
  }

  return closest.name;
}

function parseSpanishDate(raw: string): Date | null {
  const match = raw.match(DATE_RE);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const monthStr = match[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const year = parseInt(match[3], 10);

  const month = MONTH_MAP[monthStr];
  if (month === undefined) return null;

  return new Date(year, month, day);
}

function isDateString(str: string): boolean {
  return DATE_RE.test(str.trim());
}

function parseAmountString(raw: string): number {
  if (!raw || raw.trim() === '') return 0;
  const match = raw.replace(/\s/g, '').match(AMOUNT_RE);
  if (!match) return 0;

  let numStr = match[1];
  // Handle European: "1.550,00" or standard: "1,550.00"
  if (numStr.includes(',') && numStr.includes('.')) {
    if (numStr.lastIndexOf(',') > numStr.lastIndexOf('.')) {
      numStr = numStr.replace(/\./g, '').replace(',', '.');
    } else {
      numStr = numStr.replace(/,/g, '');
    }
  } else {
    numStr = numStr.replace(/,/g, '');
  }

  return parseFloat(numStr) || 0;
}

function extractTransactions(rows: PdfRow[], cols: ColumnBounds): RawPdfTransaction[] {
  const transactions: RawPdfTransaction[] = [];
  let current: RawPdfTransaction | null = null;

  for (const row of rows) {
    // Classify each item in the row by column
    const colData: Record<string, string[]> = {
      date: [], valueDate: [], desc: [], out: [], in: [], balance: [],
    };

    for (const item of row.items) {
      const col = assignToColumn(item.x, cols);
      colData[col].push(item.str);
    }

    const dateText = colData.date.join(' ').trim();
    const hasDate = isDateString(dateText);

    if (hasDate) {
      // Start a new transaction
      if (current) transactions.push(current);
      current = {
        transactionDate: dateText,
        valueDate: colData.valueDate.join(' ').trim(),
        description: colData.desc.join(' ').trim(),
        moneyOut: colData.out.join(' ').trim(),
        moneyIn: colData.in.join(' ').trim(),
        balance: colData.balance.join(' ').trim(),
      };
    } else if (current) {
      // Continuation line — append description
      const extraDesc = colData.desc.join(' ').trim();
      if (extraDesc) {
        current.description += ' ' + extraDesc;
      }
      // Also pick up amounts if they appeared on continuation line
      if (!current.moneyOut && colData.out.join('').trim()) {
        current.moneyOut = colData.out.join(' ').trim();
      }
      if (!current.moneyIn && colData.in.join('').trim()) {
        current.moneyIn = colData.in.join(' ').trim();
      }
      if (!current.balance && colData.balance.join('').trim()) {
        current.balance = colData.balance.join(' ').trim();
      }
    }
  }

  if (current) transactions.push(current);
  return transactions;
}

function inferTransactionType(description: string, moneyOut: number, moneyIn: number): string {
  const lower = description.toLowerCase();

  if (lower.includes('tarjeta') || lower.includes('card') || lower.includes('visa')
    || lower.includes('mastercard') || lower.includes('karte')) {
    return 'CARD_PAYMENT';
  }
  if (lower.includes('transferencia') || lower.includes('transfer')
    || lower.includes('überweisung') || lower.includes('virement')) {
    return 'TRANSFER';
  }
  if (lower.includes('cajero') || lower.includes('atm') || lower.includes('geldautomat')) {
    return 'ATM';
  }
  if (lower.includes('recarga') || lower.includes('top-up') || lower.includes('topup')
    || lower.includes('aufladung')) {
    return 'TOPUP';
  }
  if (lower.includes('cambio') || lower.includes('exchange') || lower.includes('umtausch')) {
    return 'EXCHANGE';
  }
  if (lower.includes('recompensa') || lower.includes('reward') || lower.includes('cashback')) {
    return 'REWARD';
  }

  // Infer from direction
  if (moneyIn > 0 && moneyOut === 0) return 'TOPUP';
  if (moneyOut > 0) return 'CARD_PAYMENT';

  return 'OTHER';
}

// --- Main export ---

export async function parseRevolutPDF(
  file: File,
  existingFingerprints: Set<string> = new Set(),
): Promise<ParseResult> {
  const errors: ParseError[] = [];

  try {
    const items = await extractTextItems(file);

    if (items.length === 0) {
      return {
        transactions: [],
        errors: [{ row: 0, message: 'No text found in PDF. Make sure this is a Revolut bank statement (not a scanned image).' }],
        duplicateCount: 0,
        totalRows: 0,
      };
    }

    const rows = groupIntoRows(items);

    // Find header rows
    const headerIndices: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (isHeaderRow(rows[i])) headerIndices.push(i);
    }

    if (headerIndices.length === 0) {
      return {
        transactions: [],
        errors: [{ row: 0, message: 'Could not find transaction table headers in PDF. Make sure this is a Revolut bank statement.' }],
        duplicateCount: 0,
        totalRows: 0,
      };
    }

    // Use header rows to detect column positions
    const headerRows = headerIndices.map(i => rows[i]);
    const cols = detectColumns(headerRows);

    if (!cols) {
      return {
        transactions: [],
        errors: [{ row: 0, message: 'Could not determine table column positions from PDF headers.' }],
        duplicateCount: 0,
        totalRows: 0,
      };
    }

    // Get data rows (everything after the first header, excluding other headers)
    const headerSet = new Set(headerIndices);
    const firstHeader = headerIndices[0];
    const dataRows = rows.filter((_row, i) => i > firstHeader && !headerSet.has(i));

    // Extract raw transactions
    const rawTxns = extractTransactions(dataRows, cols);

    if (rawTxns.length === 0) {
      return {
        transactions: [],
        errors: [{ row: 0, message: 'No transactions found in the PDF. The file may be empty or in an unexpected format.' }],
        duplicateCount: 0,
        totalRows: 0,
      };
    }

    // Convert to Transaction objects
    const transactions: Transaction[] = [];
    let duplicateCount = 0;
    const batchId = crypto.randomUUID();
    const now = new Date();

    for (let i = 0; i < rawTxns.length; i++) {
      const raw = rawTxns[i];

      try {
        const startedDate = parseSpanishDate(raw.transactionDate) ?? new Date();
        const completedDate = parseSpanishDate(raw.valueDate) ?? startedDate;
        const description = raw.description.replace(/\s+/g, ' ').trim();
        const moneyOut = parseAmountString(raw.moneyOut);
        const moneyIn = parseAmountString(raw.moneyIn);
        const amount = moneyIn > 0 ? moneyIn : -moneyOut;
        const balance = parseAmountString(raw.balance);

        if (!description && amount === 0) continue;

        const fingerprint = getFingerprint(description, amount, startedDate);
        if (existingFingerprints.has(fingerprint)) {
          duplicateCount++;
          continue;
        }
        existingFingerprints.add(fingerprint);

        const type = inferTransactionType(description, moneyOut, moneyIn);

        transactions.push({
          id: crypto.randomUUID(),
          type: type as Transaction['type'],
          product: '',
          startedDate,
          completedDate,
          description,
          amount,
          fee: 0,
          currency: 'EUR',
          state: 'COMPLETED',
          balance,
          categoryId: null,
          importedAt: now,
          importBatchId: batchId,
        });
      } catch (err) {
        errors.push({
          row: i + 1,
          message: err instanceof Error ? err.message : 'Failed to parse transaction',
        });
      }
    }

    return {
      transactions,
      errors,
      duplicateCount,
      totalRows: rawTxns.length,
    };
  } catch (err) {
    return {
      transactions: [],
      errors: [{ row: 0, message: err instanceof Error ? err.message : 'Failed to read PDF file.' }],
      duplicateCount: 0,
      totalRows: 0,
    };
  }
}
