import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendPoint } from '../../services/analyticsService';
import { formatCurrency } from '../../utils/formatters';

interface SpendingTrendLineProps {
  data: TrendPoint[];
  currency?: string;
}

interface TooltipPayloadItem {
  value: number;
  payload: TrendPoint;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-slate-700 px-3 py-2 rounded-lg shadow-lg text-sm">
      <p className="text-slate-100">{item.payload.date}</p>
      <p className="text-sky-400 font-medium">{formatCurrency(item.value)}</p>
    </div>
  );
}

export default function SpendingTrendLine({ data, currency: _currency }: SpendingTrendLineProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-slate-500">
        No trend data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}>
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#64748B' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${Math.round(v)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#38BDF8"
          strokeWidth={2}
          fill="url(#trendGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
