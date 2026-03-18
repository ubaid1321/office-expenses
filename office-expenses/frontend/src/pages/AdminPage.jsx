import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function AdminPage() {
  const { user: me } = useAuth();
  const now = new Date();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Budget state
  const [budgetForm, setBudgetForm] = useState({
    amount: '', month: now.getMonth() + 1, year: now.getFullYear(), notes: '',
  });
  const [currentBudget, setCurrentBudget] = useState(null);
  const [savingBudget, setSavingBudget]   = useState(false);

  // Users state
  const [users, setUsers]         = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  // Load budget for selected month
  const loadBudget = async () => {
    try {
      const { data } = await api.get('/budget', {
        params: { month: budgetForm.month, year: budgetForm.year },
      });
      setCurrentBudget(data.budget);
      if (data.budget) setBudgetForm(f => ({ ...f, amount: data.budget.amount, notes: data.budget.notes || '' }));
      else             setBudgetForm(f => ({ ...f, amount: '', notes: '' }));
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { loadBudget(); }, [budgetForm.month, budgetForm.year]);
  useEffect(() => { loadUsers(); }, []);

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetForm.amount || budgetForm.amount <= 0) {
      toast.error('Enter a valid budget amount');
      return;
    }
    setSavingBudget(true);
    try {
      await api.post('/budget', {
        amount: parseFloat(budgetForm.amount),
        month:  budgetForm.month,
        year:   budgetForm.year,
        notes:  budgetForm.notes,
      });
      toast.success('Budget saved!');
      loadBudget();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSavingBudget(false);
    }
  };

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'employee' : 'admin';
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success(`Role updated to ${newRole}`);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await api.delete(`/admin/users/${deleteUserId}`);
      toast.success('User removed');
      setDeleteUserId(null);
      loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage budget and team members</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* ── Set Monthly Budget ── */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">Monthly Budget</h2>
          <div className="card p-6">
            {currentBudget && (
              <div className="mb-5 p-4 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-0.5">Current Budget</p>
                <p className="text-2xl font-bold font-mono text-green-700">{fmt(currentBudget.amount)}</p>
                <p className="text-xs text-green-600 mt-0.5">
                  Set by {currentBudget.setBy?.name} · {format(new Date(currentBudget.updatedAt), 'dd MMM yyyy')}
                </p>
                {currentBudget.notes && (
                  <p className="text-xs text-green-600 mt-1 italic">"{currentBudget.notes}"</p>
                )}
              </div>
            )}

            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Month</label>
                  <select className="input" value={budgetForm.month}
                    onChange={e => setBudgetForm(f => ({ ...f, month: +e.target.value }))}>
                    {MONTHS.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <select className="input" value={budgetForm.year}
                    onChange={e => setBudgetForm(f => ({ ...f, year: +e.target.value }))}>
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Budget Amount (₹)</label>
                <input className="input font-mono text-lg" type="number" min="1" step="1"
                  placeholder="e.g. 100000"
                  value={budgetForm.amount}
                  onChange={e => setBudgetForm(f => ({ ...f, amount: e.target.value }))}
                  required />
              </div>

              <div>
                <label className="label">Notes <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                <input className="input" placeholder="e.g. Q1 project budget"
                  value={budgetForm.notes}
                  onChange={e => setBudgetForm(f => ({ ...f, notes: e.target.value }))} />
              </div>

              <button type="submit" className="btn-primary w-full" disabled={savingBudget}>
                {savingBudget
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</span>
                  : currentBudget ? 'Update Budget' : 'Set Budget'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Team Members ── */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Team Members <span className="text-gray-400 font-normal text-sm">({users.length})</span>
          </h2>
          <div className="card overflow-hidden">
            {loadingUsers ? (
              <div className="py-12 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {users.map((u) => (
                  <div key={u._id} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gray-900 text-white text-sm font-bold flex items-center justify-center shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                        {u._id === me?._id && (
                          <span className="badge bg-gray-100 text-gray-500">you</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{u.email}{u.department ? ` · ${u.department}` : ''}</p>
                    </div>

                    {/* Role badge */}
                    <span className={`badge shrink-0 ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.role === 'admin' ? '★ Admin' : 'Employee'}
                    </span>

                    {/* Actions (not self) */}
                    {u._id !== me?._id && (
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => toggleRole(u._id, u.role)}
                          className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title={u.role === 'admin' ? 'Demote to employee' : 'Make admin'}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteUserId(u._id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove user"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete user confirm */}
      {deleteUserId && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Remove this user?</h3>
            <p className="text-sm text-gray-500 mb-6">Their expenses will remain but their account will be deleted.</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setDeleteUserId(null)}>Cancel</button>
              <button className="btn-danger flex-1" onClick={handleDeleteUser}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
