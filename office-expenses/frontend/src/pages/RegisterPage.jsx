import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Join your office workspace</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Raj Kumar" value={form.name} onChange={set('name')} required autoFocus />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="raj@company.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="label">Department <span className="normal-case font-normal text-gray-400">(optional)</span></label>
              <input className="input" placeholder="e.g. Sales, Engineering" value={form.department} onChange={set('department')} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required minLength={6} />
            </div>
            <button className="btn-primary w-full mt-2" type="submit" disabled={loading}>
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating…</span>
                : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gray-900 hover:underline">Sign in</Link>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          The first person to register becomes the admin.
        </p>
      </div>
    </div>
  );
}
