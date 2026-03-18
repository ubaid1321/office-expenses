import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../utils/api';

const CATEGORY_COLORS = {
  'Travel': '#3b82f6',
  'Food & Drinks': '#f59e0b',
  'Office Supplies': '#8b5cf6',
  'Client Entertainment': '#ec4899',
  'Accommodation': '#14b8a6',
  'Communication': '#6366f1',
  'Utilities': '#f97316',
  'Maintenance': '#10b981',
  'Miscellaneous': '#94a3b8',
};

const fmt = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

function BudgetBar({ spent, total }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0;
  const danger = pct >= 90;
  const warn   = pct >= 70;
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget Used</p>
          <p className="text-3xl font-bold font-mono text-gray-900 mt-0.5">{fmt(spent)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">of {fmt(total)}</p>
          <p className={`text-lg font-bold font-mono ${danger ? 'text-red-500' : warn ? 'text-amber-500' : 'text-green-600'}`}>
            {fmt(total - spent)} left
          </p>
        </div>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${danger ? 'bg-red-500' : warn ? 'bg-amber-400' : 'bg-green-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1">{pct.toFixed(1)}% of monthly budget used</p>
    </div>
  );
}

export default function DashboardPage() {
  const now = new Date();
  const [month, setMonth]     = useState(now.getMonth() + 1);
  const [year, setYear]       = useState(now.getFullYear());
  const [budgetData, setBudgetData] = useState(null);
  const [summary, setSummary]       = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [b, s, e] = await Promise.all([
          api.get('/budget', { params: { month, year } }),
          api.get('/expenses/summary', { params: { month, year } }),
          api.get('/expenses', { params: { month, year, limit: 6 } }),
        ]);
        setBudgetData(b.data);
        setSummary(s.data);
        setRecentExpenses(e.data.expenses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month, year]);

  const pieData = (summary?.byCategory || []).map((c) => ({
    name: c._id,
    value: c.total,
    color: CATEGORY_COLORS[c._id] || '#94a3b8',
  }));

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Office expense overview</p>
        </div>
        {/* Month picker */}
        <div className="flex items-center gap-2">
          <select className="input w-28 py-2" value={month} onChange={e => setMonth(+e.target.value)}>
            {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select className="input w-24 py-2" value={year} onChange={e => setYear(+e.target.value)}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Budget card */}
          <div className="card p-6 mb-6">
            {budgetData?.budget ? (
              <BudgetBar spent={budgetData.totalSpent} total={budgetData.budget.amount} />
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 text-sm">No budget set for {MONTHS[month-1]} {year}.</p>
                <p className="text-gray-400 text-xs mt-1">Ask your admin to set the monthly budget.</p>
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total Expenses', value: fmt(budgetData?.totalSpent), sub: `${budgetData?.expenseCount || 0} transactions` },
              { label: 'Remaining Budget', value: budgetData?.budget ? fmt(budgetData.remaining) : '—', sub: budgetData?.budget ? 'Available to spend' : 'No budget set' },
              { label: 'Team Members', value: summary?.byPerson?.length || 0, sub: 'with expenses this month' },
            ].map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{s.label}</p>
                <p className="text-2xl font-bold font-mono text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Charts + per-person */}
          <div className="grid grid-cols-5 gap-6 mb-6">
            {/* Pie */}
            <div className="card p-5 col-span-2">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">By Category</h2>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85}
                      paddingAngle={2} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [fmt(v)]}
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No expenses yet</div>
              )}
            </div>

            {/* Per-person table */}
            <div className="card p-5 col-span-3">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Spend per Person</h2>
              {summary?.byPerson?.length > 0 ? (
                <div className="space-y-2">
                  {summary.byPerson.map((p) => {
                    const pct = budgetData?.budget
                      ? Math.min((p.total / budgetData.budget.amount) * 100, 100)
                      : 0;
                    return (
                      <div key={p._id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold shrink-0">
                              {p.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 leading-tight">{p.user.name}</p>
                              {p.user.department && (
                                <p className="text-xs text-gray-400">{p.user.department}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold font-mono text-gray-900">{fmt(p.total)}</p>
                            <p className="text-xs text-gray-400">{p.count} items</p>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-900 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No expenses yet</div>
              )}
            </div>
          </div>

          {/* Recent transactions */}
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent Transactions</h2>
              <a href="/expenses" className="text-xs text-gray-500 hover:text-gray-900 font-medium">View all →</a>
            </div>
            {recentExpenses.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No transactions this month</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentExpenses.map((e) => (
                  <div key={e._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold text-white"
                      style={{ background: CATEGORY_COLORS[e.category] || '#94a3b8' }}>
                      {e.category.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{e.description}</p>
                      <p className="text-xs text-gray-400">
                        {e.spentBy?.name} · {e.category} · {format(new Date(e.date), 'dd MMM')}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-sm text-gray-900">{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
