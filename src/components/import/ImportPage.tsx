import { useState } from 'react';
import Header from '../layout/Header';
import FileDropZone from './FileDropZone';
import ImportPreview from './ImportPreview';
import ImportProgress from './ImportProgress';
import { parseRevolutCSV, type ParseResult } from '../../services/csvParser';
import { autoClassifyTransactions } from '../../services/categoryService';
import { useTransactions } from '../../hooks/useTransactions';
import type { Transaction } from '../../models/Transaction';

type ImportStep = 'select' | 'preview' | 'importing' | 'done';

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('select');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [classifiedTransactions, setClassifiedTransactions] = useState<Transaction[]>([]);
  const [autoClassifiedCount, setAutoClassifiedCount] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [isParsing, setIsParsing] = useState(false);

  const { addTransactions, getExistingFingerprints } = useTransactions();

  const handleFileSelect = async (file: File) => {
    setIsParsing(true);
    try {
      const fingerprints = await getExistingFingerprints();
      const result = await parseRevolutCSV(file, fingerprints);

      // Auto-classify
      const classified = await autoClassifyTransactions(result.transactions);
      const autoCount = classified.filter(t => t.categoryId !== null).length;

      setParseResult({ ...result, transactions: classified });
      setClassifiedTransactions(classified);
      setAutoClassifiedCount(autoCount);
      setStep('preview');
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!classifiedTransactions.length) return;
    setStep('importing');

    try {
      await addTransactions(classifiedTransactions);
      setImportedCount(classifiedTransactions.length);
      setStep('done');
    } catch (err) {
      console.error('Import failed:', err);
      setStep('preview');
    }
  };

  const handleCancel = () => {
    setStep('select');
    setParseResult(null);
    setClassifiedTransactions([]);
    setAutoClassifiedCount(0);
  };

  const handleReset = () => {
    handleCancel();
    setImportedCount(0);
  };

  return (
    <div>
      <Header
        title="Import CSV"
        rightAction={
          step === 'done' ? (
            <button
              onClick={handleReset}
              className="text-sm text-sky-400 font-medium"
            >
              Import More
            </button>
          ) : undefined
        }
      />
      <div className="p-4">
        {step === 'select' && (
          <div className="space-y-4">
            <FileDropZone onFileSelect={handleFileSelect} isLoading={isParsing} />
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-2">How to export from Revolut:</h3>
              <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
                <li>Open Revolut app</li>
                <li>Go to your account / transaction history</li>
                <li>Tap the statement/export icon</li>
                <li>Select date range and CSV format</li>
                <li>Download and upload the file here</li>
              </ol>
            </div>
          </div>
        )}

        {step === 'preview' && parseResult && (
          <ImportPreview
            result={parseResult}
            autoClassifiedCount={autoClassifiedCount}
            onConfirm={handleConfirmImport}
            onCancel={handleCancel}
            isImporting={false}
          />
        )}

        {step === 'importing' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300">Importing transactions...</p>
          </div>
        )}

        {step === 'done' && (
          <ImportProgress
            importedCount={importedCount}
            autoClassifiedCount={autoClassifiedCount}
          />
        )}
      </div>
    </div>
  );
}
