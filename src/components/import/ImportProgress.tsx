import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ImportProgressProps {
  importedCount: number;
  autoClassifiedCount: number;
}

export default function ImportProgress({ importedCount, autoClassifiedCount }: ImportProgressProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
        <CheckCircle size={32} className="text-emerald-400" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-100">Import Complete!</h2>
        <p className="text-slate-400 mt-2">
          {importedCount} transactions imported
        </p>
        {autoClassifiedCount > 0 && (
          <p className="text-sm text-emerald-400 mt-1">
            {autoClassifiedCount} auto-classified
          </p>
        )}
      </div>

      <div className="flex gap-3 w-full">
        <button
          onClick={() => navigate('/transactions')}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
        >
          View Transactions
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 px-4 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-400 transition-colors"
        >
          Dashboard
        </button>
      </div>
    </div>
  );
}
