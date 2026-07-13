import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

interface UserRow {
  id: number;
  username: string;
  phone: string | null;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export function UsersPage() {
  const { roles } = useAuth();
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (query = q) => {
    try {
      const params = new URLSearchParams({ page: '0', size: '50' });
      if (query) params.set('q', query);
      const res = await apiFetch<{ success: boolean; data: UserRow[] }>(`/admin/users?${params}`);
      setUsers(res.data);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [q]);

  useEffect(() => { void load(); }, [load]);

  async function updateRole(id: number, role: string) {
    await apiFetch(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
    await load();
  }

  async function updateStatus(id: number, status: string) {
    await apiFetch(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <div>
      <h1 className="page-title">用户管理</h1>
      <div className="toolbar">
        <input placeholder="搜索用户名/手机号" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" onClick={() => void load()}>搜索</button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th><th>用户名</th><th>手机</th><th>角色</th><th>状态</th><th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.phone ?? '—'}</td>
              <td>
                <span className={`badge ${u.role === 'SUPER_ADMIN' ? 'super' : u.role === 'ADMIN' ? 'admin' : ''}`}>{u.role}</span>
              </td>
              <td>
                <span className={`badge ${u.status === 'disabled' ? 'disabled' : ''}`}>{u.status}</span>
              </td>
              <td>
                {isSuperAdmin && (
                  <select defaultValue={u.role} onChange={(e) => void updateRole(u.id, e.target.value)}>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                )}
                <select defaultValue={u.status} onChange={(e) => void updateStatus(u.id, e.target.value)} style={{ marginLeft: 8 }}>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
