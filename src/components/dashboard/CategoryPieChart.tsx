import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySlice } from '../../services/analyticsService';
import { formatCurrency } from '../../utils/formatters';

interface CategoryPieChartProps {
  data: CategorySlice[];
  currency?: string;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: CategorySlice;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-700 px-3 py-2 rounded-lg shadow-lg text-sm">
      <p className="font-medium text-slate-100">{item.payload.categoryName}</p>
      <p className="text-slate-300">{formatCurrency(item.value)} ({item.payload.percentage.toFixed(1)}%)</p>
    </div>
  );
}

export default function CategoryPieChart({ data, currency: _currency }: CategoryPieChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-slate-500">
        No expense data
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            dataKey="total"
            nameKey="categoryName"
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.categoryId ?? 'uncat'} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 px-2">
        {data.slice(0, 6).map(item => (
          <div key={item.categoryId ?? 'uncat'} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-slate-400">{item.categoryName}</span>
            <span className="text-xs text-slate-500">{item.percentage.toFixed(0)}%</span>
          </div>
        ))}
        {data.length > 6 && (
          <span className="text-xs text-slate-500">+{data.length - 6} more</span>
        )}
      </div>
    </div>
  );
}
