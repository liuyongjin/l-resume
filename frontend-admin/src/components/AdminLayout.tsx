import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './AdminLayout.css';

export function AdminLayout() {
  const { username, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">简流 Admin</div>
        <nav>
          <NavLink to="/" end>仪表盘</NavLink>
          <NavLink to="/users">用户管理</NavLink>
        </nav>
        <div className="sidebar-footer">
          <span>{username}</span>
          <button type="button" onClick={logout}>退出</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
