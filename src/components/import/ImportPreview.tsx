import { AlertCircle, CheckCircle, Copy, ArrowRight } from 'lucide-react';
import type { ParseResult } from '../../services/csvParser';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ImportPreviewProps {
  result: ParseResult;
  autoClassifiedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isImporting: boolean;
}

export default function ImportPreview({
  result,
  autoClassifiedCount,
  onConfirm,
  onCancel,
  isImporting,
}: ImportPreviewProps) {
  const { transactions, errors, duplicateCount, totalRows } = result;

  const dates = transactions.map(t => t.startedDate);
  const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : null;
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;

  const totalAmount = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const currency = transactions[0]?.currency ?? 'EUR';

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Transactions</p>
          <p className="text-2xl font-bold text-slate-100">{transactions.length}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalAmount, currency)}</p>
        </div>
      </div>

      {/* Date range */}
      {minDate && maxDate && (
        <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-2">
          <span className="text-sm text-slate-400">Date range:</span>
          <span className="text-sm text-slate-200">{formatDate(minDate)}</span>
          <ArrowRight size={14} className="text-slate-500" />
          <span className="text-sm text-slate-200">{formatDate(maxDate)}</span>
        </div>
      )}

      {/* Info badges */}
      <div className="flex flex-wrap gap-2">
        {autoClassifiedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full">
            <CheckCircle size={14} />
            {autoClassifiedCount} auto-classified
          </span>
        )}
        {duplicateCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-3 py-1.5 rounded-full">
            <Copy size={14} />
            {duplicateCount} duplicates skipped
          </span>
        )}
        {errors.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full">
            <AlertCircle size={14} />
            {errors.length} errors
          </span>
        )}
      </div>

      {/* Errors detail */}
      {errors.length > 0 && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-3">
          <p className="text-sm font-medium text-red-400 mb-2">Parse Errors:</p>
          <ul className="space-y-1">
            {errors.slice(0, 5).map((err, i) => (
              <li key={i} className="text-xs text-red-300">
                Row {err.row}: {err.message}
              </li>
            ))}
            {errors.length > 5 && (
              <li className="text-xs text-red-400">...and {errors.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Preview list */}
      {transactions.length > 0 && (
        <div className="bg-slate-800 rounded-xl overflow-hidden">
          <p className="px-4 pt-3 pb-2 text-sm text-slate-400">Preview (first 10):</p>
          <div className="divide-y divide-slate-700">
            {transactions.slice(0, 10).map(txn => (
              <div key={txn.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 truncate">{txn.description}</p>
                  <p className="text-xs text-slate-500">{formatDate(txn.startedDate)}</p>
                </div>
                <span className={`text-sm font-medium ml-3 ${txn.amount < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(txn.amount, txn.currency)}
                </span>
              </div>
            ))}
          </div>
          {transactions.length > 10 && (
            <p className="px-4 py-2 text-xs text-slate-500">
              ...and {transactions.length - 10} more transactions
            </p>
          )}
        </div>
      )}

      {/* Summary from total rows */}
      <p className="text-xs text-slate-500 text-center">
        Parsed {totalRows} rows from CSV
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isImporting}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isImporting || transactions.length === 0}
          className="flex-1 py-3 px-4 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-400 transition-colors disabled:opacity-50"
        >
          {isImporting ? 'Importing...' : `Import ${transactions.length}`}
        </button>
      </div>
    </div>
  );
}
