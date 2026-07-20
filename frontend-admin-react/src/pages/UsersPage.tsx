import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { ApiResponse } from '../auth/types';

interface FrontUser {
  id: number;
  username: string;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  status: string;
  createdAt?: string | null;
}

export function UsersPage() {
  const { hasPermission } = useAuth();
  const canToggleStatus = hasPermission('front-user:status');
  const [users, setUsers] = useState<FrontUser[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async (query = q) => {
    try {
      const params = new URLSearchParams({ page: '0', size: '50' });
      if (query) params.set('q', query);
      const res = await apiFetch<ApiResponse<FrontUser[]>>(`/admin/front-users?${params}`);
      setUsers(res.data ?? []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [q]);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(id: number, status: string) {
    try {
      await apiFetch(`/admin/front-users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div>
      <h1 className="page-title">前台用户</h1>
      <div className="toolbar">
        <input
          placeholder="搜索用户名/手机号"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void load(); }}
        />
        <button type="button" onClick={() => void load()}>搜索</button>
      </div>
      {error && <p className="error-text">{error}</p>}
      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>手机</th>
            <th>邮箱</th>
            <th>角色</th>
            <th>状态</th>
            {canToggleStatus ? <th>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr><td colSpan={canToggleStatus ? 7 : 6}>暂无数据</td></tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.phone ?? '—'}</td>
                <td>{u.email ?? '—'}</td>
                <td>{u.role ?? '—'}</td>
                <td>
                  <span className={`badge ${u.status === 'disabled' ? 'disabled' : 'ok'}`}>
                    {u.status}
                  </span>
                </td>
                {canToggleStatus ? (
                  <td>
                    <select
                      value={u.status}
                      onChange={(e) => void updateStatus(u.id, e.target.value)}
                    >
                      <option value="active">active</option>
                      <option value="disabled">disabled</option>
                    </select>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
