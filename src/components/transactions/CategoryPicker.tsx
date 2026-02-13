import { useState } from 'react';
import { X } from 'lucide-react';
import { useCategories } from '../../hooks/useCategories';
import CategoryIcon from '../common/CategoryIcon';

interface CategoryPickerProps {
  suggestedCategoryId?: string | null;
  onSelect: (categoryId: string, applyToSimilar: boolean) => void;
  onClose: () => void;
}

export default function CategoryPicker({ suggestedCategoryId, onSelect, onClose }: CategoryPickerProps) {
  const { categories } = useCategories();
  const [applyToSimilar, setApplyToSimilar] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-lg bg-slate-800 rounded-t-2xl max-h-[70vh] flex flex-col"
        style={{ paddingBottom: `var(--sab)` }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <h3 className="text-lg font-semibold text-slate-100">Select Category</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Category grid */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {categories.map(cat => {
              const isSuggested = cat.id === suggestedCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelect(cat.id, applyToSimilar)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors ${
                    isSuggested
                      ? 'bg-sky-500/20 ring-1 ring-sky-400'
                      : 'bg-slate-700/50 hover:bg-slate-700'
                  }`}
                >
                  <CategoryIcon icon={cat.icon} color={cat.color} size={24} />
                  <span className="text-xs text-slate-300 text-center leading-tight">{cat.name}</span>
                  {isSuggested && (
                    <span className="text-[10px] text-sky-400 font-medium">Suggested</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Apply to similar toggle */}
        <div className="px-4 py-3 border-t border-slate-700">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToSimilar}
              onChange={e => setApplyToSimilar(e.target.checked)}
              className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-sky-500 focus:ring-sky-500 accent-sky-500"
            />
            <span className="text-sm text-slate-300">Apply to all similar transactions</span>
          </label>
        </div>
      </div>
    </div>
  );
}
