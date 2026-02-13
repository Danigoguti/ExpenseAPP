import Header from '../layout/Header';
import FilterBar from './FilterBar';
import SummaryCards from './SummaryCards';
import CategoryPieChart from './CategoryPieChart';
import MonthlyBarChart from './MonthlyBarChart';
import SpendingTrendLine from './SpendingTrendLine';
import EmptyState from '../common/EmptyState';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useFilters } from '../../hooks/useFilters';
import { useAnalytics } from '../../hooks/useAnalytics';

export default function DashboardPage() {
  const { timePeriod, setTimePeriod, transactionFilter } = useFilters();
  const { transactions, transactionCount } = useTransactions(transactionFilter);
  const { categories } = useCategories();
  const { summary, categoryBreakdown, monthlyTotals, spendingTrend } = useAnalytics(transactions, categories);

  const currency = transactions[0]?.currency ?? 'EUR';

  if (transactionCount === 0) {
    return (
      <div>
        <Header title="Dashboard" />
        <EmptyState />
      </div>
    );
  }

  return (
    <div>
      <Header title="Dashboard" />
      <div className="p-4 space-y-6">
        {/* Filters */}
        <FilterBar timePeriod={timePeriod} onTimePeriodChange={setTimePeriod} />

        {/* Summary cards */}
        <SummaryCards stats={summary} currency={currency} />

        {/* Category breakdown */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Spending by Category</h2>
          <div className="bg-slate-800 rounded-xl p-4">
            <CategoryPieChart data={categoryBreakdown} currency={currency} />
          </div>
        </section>

        {/* Monthly comparison */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Monthly Comparison</h2>
          <div className="bg-slate-800 rounded-xl p-4">
            <MonthlyBarChart data={monthlyTotals} currency={currency} />
          </div>
        </section>

        {/* Spending trend */}
        <section>
          <h2 className="text-sm font-medium text-slate-400 mb-3">Spending Trend</h2>
          <div className="bg-slate-800 rounded-xl p-4">
            <SpendingTrendLine data={spendingTrend} currency={currency} />
          </div>
        </section>

        {/* Bottom padding for safe scroll area */}
        <div className="h-4" />
      </div>
    </div>
  );
}
