import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Travel','Food & Drinks','Office Supplies','Client Entertainment',
  'Accommodation','Communication','Utilities','Maintenance','Miscellaneous',
];

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ── Expense Modal ──────────────────────────────────────────────────
function ExpenseModal({ expense, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: expense?.description || '',
    amount:      expense?.amount || '',
    category:    expense?.category || '',
    date:        expense ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    notes:       expense?.notes || '',
  });
  const [file, setFile]     = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('receipt', file);

      if (expense) {
        await api.put(`/expenses/${expense._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Expense updated!');
      } else {
        await api.post('/expenses', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Expense added!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="font-semibold text-gray-900">{expense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="label">Description</label>
            <input className="input" placeholder="What was this expense for?" value={form.description} onChange={set('description')} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹)</label>
              <input className="input font-mono" type="number" min="0.01" step="0.01" placeholder="0.00"
                value={form.amount} onChange={set('amount')} required />
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={form.date} onChange={set('date')} required />
            </div>
          </div>

          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={set('category')} required>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Receipt <span className="normal-case font-normal text-gray-400">(JPG, PNG or PDF, max 5MB)</span></label>
            <div className="mt-1">
              {expense?.receipt && !file && (
                <p className="text-xs text-green-600 mb-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Receipt already uploaded
                </p>
              )}
              <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-gray-500">{file ? file.name : 'Click to attach receipt'}</span>
                <input type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf"
                  onChange={e => setFile(e.target.files[0] || null)} />
              </label>
            </div>
          </div>

          <div>
            <label className="label">Notes <span className="normal-case font-normal text-gray-400">(optional)</span></label>
            <textarea className="input resize-none" rows={2} placeholder="Any additional details…"
              value={form.notes} onChange={set('notes')} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</span>
                : expense ? 'Save changes' : 'Add expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────
export default function ExpensesPage() {
  const { user } = useAuth();
  const now = new Date();

  const [expenses, setExpenses] = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [loading, setLoading]   = useState(false);

  const [filters, setFilters] = useState({
    month: now.getMonth() + 1, year: now.getFullYear(),
    category: '', page: 1,
  });
  const [modal, setModal]     = useState({ open: false, expense: null });
  const [deleteId, setDeleteId] = useState(null);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 15 };
      if (!params.category) delete params.category;
      const { data } = await api.get('/expenses', { params });
      setExpenses(data.expenses);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (k) => (e) =>
    setFilters(f => ({ ...f, [k]: e.target.value, page: 1 }));

  const handleDelete = async () => {
    try {
      await api.delete(`/expenses/${deleteId}`);
      toast.success('Expense deleted');
      setDeleteId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const canEdit = (exp) =>
    user?.role === 'admin' || exp.spentBy?._id === user?._id;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} records found</p>
        </div>
        <button className="btn-primary flex items-center gap-2"
          onClick={() => setModal({ open: true, expense: null })}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add expense
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <select className="input w-28" value={filters.month} onChange={setFilter('month')}>
          {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="input w-24" value={filters.year} onChange={setFilter('year')}>
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="input flex-1 min-w-[180px]" value={filters.category} onChange={setFilter('category')}>
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-500 text-sm">No expenses found for this period</p>
            <button className="btn-primary mt-4 text-xs"
              onClick={() => setModal({ open: true, expense: null })}>
              Add first expense
            </button>
          </div>
        ) : (
          <>
            {/* Col headers */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <span>Description</span><span>Category</span><span>Spent By</span>
              <span className="text-right">Amount</span><span />
            </div>

            {expenses.map((e) => (
              <div key={e._id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors items-center">
                {/* Description + date + receipt */}
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{format(new Date(e.date), 'dd MMM yyyy')}</span>
                    {e.receipt && (
                      <a href={`/uploads/${e.receipt}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        receipt
                      </a>
                    )}
                    {e.notes && (
                      <span className="text-xs text-gray-400 truncate max-w-[140px]" title={e.notes}>
                        · {e.notes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <span className="badge bg-gray-100 text-gray-700">{e.category}</span>

                {/* Spent by */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs flex items-center justify-center font-bold shrink-0">
                    {e.spentBy?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 truncate">{e.spentBy?.name}</span>
                </div>

                {/* Amount */}
                <span className="font-mono font-semibold text-sm text-gray-900 text-right">{fmt(e.amount)}</span>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {canEdit(e) && (
                    <>
                      <button onClick={() => setModal({ open: true, expense: e })}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setDeleteId(e._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3">
                <span className="text-xs text-gray-400">Page {filters.page} of {pages}</span>
                <div className="flex gap-2">
                  <button className="btn-secondary py-1.5 px-3 text-xs" disabled={filters.page <= 1}
                    onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
                  <button className="btn-secondary py-1.5 px-3 text-xs" disabled={filters.page >= pages}
                    onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {modal.open && (
        <ExpenseModal expense={modal.expense} onClose={() => setModal({ open: false, expense: null })} onSaved={load} />
      )}

      {deleteId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Delete this expense?</h3>
            <p className="text-sm text-gray-500 mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
