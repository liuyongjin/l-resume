import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { AdminMenu } from '../auth/types';
import './AdminLayout.css';

function SidebarItems({ items }: { items: AdminMenu[] }) {
  return (
    <>
      {items.map((item) => {
        if (item.type === 'button') return null;

        if (item.type === 'directory') {
          return (
            <div key={item.id} className="nav-group">
              <div className="nav-group-title">{item.name}</div>
              {item.children?.length ? <SidebarItems items={item.children} /> : null}
            </div>
          );
        }

        if (item.type === 'menu' && item.path) {
          return (
            <NavLink key={item.id} to={item.path} end={item.path === '/'}>
              {item.name}
            </NavLink>
          );
        }

        if (item.children?.length) {
          return (
            <div key={item.id} className="nav-group">
              <div className="nav-group-title">{item.name}</div>
              <SidebarItems items={item.children} />
            </div>
          );
        }

        return null;
      })}
    </>
  );
}

export function AdminLayout() {
  const { username, nickname, menus, logout } = useAuth();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">简流 Admin</div>
        <nav>
          <SidebarItems items={menus} />
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{nickname || username}</span>
          <button type="button" onClick={logout}>退出登录</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
