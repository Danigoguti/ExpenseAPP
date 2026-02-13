import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyTotal } from '../../services/analyticsService';
import { formatCurrency } from '../../utils/formatters';

interface MonthlyBarChartProps {
  data: MonthlyTotal[];
  currency?: string;
}

interface TooltipPayloadItem {
  value: number;
  payload: MonthlyTotal;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-700 px-3 py-2 rounded-lg shadow-lg text-sm">
      <p className="text-slate-100">{item.payload.monthKey}</p>
      <p className="text-red-400 font-medium">{formatCurrency(item.value)}</p>
    </div>
  );
}

export default function MonthlyBarChart({ data, currency: _currency }: MonthlyBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-slate-500">
        No monthly data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${Math.round(v)}`}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }} />
        <Bar dataKey="total" fill="#38BDF8" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
