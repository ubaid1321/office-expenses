import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import AdminPage from './pages/AdminPage';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
    </div>
  );
}

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return !user ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index          element={<DashboardPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="admin"   element={<PrivateRoute adminOnly><AdminPage /></PrivateRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
