import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, authenticated } = useAuth();
  if (loading) return <div className="login-page"><div className="login-card">加载中…</div></div>;
  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}
