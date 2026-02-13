import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

export default function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
        <Upload size={28} className="text-slate-500" />
      </div>
      <h2 className="text-lg font-semibold text-slate-200 mb-2">No expenses yet</h2>
      <p className="text-sm text-slate-400 mb-6 max-w-xs">
        Import your Revolut CSV export to start tracking and categorizing your expenses
      </p>
      <button
        onClick={() => navigate('/import')}
        className="px-6 py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-400 transition-colors"
      >
        Import CSV
      </button>
    </div>
  );
}
