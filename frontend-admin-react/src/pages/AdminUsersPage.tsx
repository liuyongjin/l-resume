import { FormEvent, useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { ApiResponse } from '../auth/types';

interface AdminUser {
  id: number;
  username: string;
  nickname?: string | null;
  status: string;
  roleCodes?: string[];
  roleIds?: number[];
  createdAt?: string | null;
}

interface RoleOption {
  id: number;
  code: string;
  name: string;
}

export function AdminUsersPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('admin-user:create');
  const canUpdate = hasPermission('admin-user:update');
  const canAssignRole = hasPermission('admin-user:assign-role');

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', nickname: '' });
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: '0', size: '50' });
      const res = await apiFetch<ApiResponse<AdminUser[]>>(`/admin/admin-users?${params}`);
      setUsers(res.data ?? []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      const res = await apiFetch<ApiResponse<RoleOption[]>>('/admin/roles');
      setRoles(res.data ?? []);
    } catch {
      /* roles endpoint may be forbidden for some users */
    }
  }, []);

  useEffect(() => {
    void load();
    if (canAssignRole) void loadRoles();
  }, [load, loadRoles, canAssignRole]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    try {
      await apiFetch('/admin/admin-users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setForm({ username: '', password: '', nickname: '' });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await apiFetch(`/admin/admin-users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openAssign(user: AdminUser) {
    setAssigningId(user.id);
    setSelectedRoleIds(user.roleIds ?? []);
  }

  async function saveRoles() {
    if (assigningId == null) return;
    try {
      await apiFetch(`/admin/admin-users/${assigningId}/roles`, {
        method: 'PUT',
        body: JSON.stringify({ roleIds: selectedRoleIds }),
      });
      setAssigningId(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function toggleRole(id: number) {
    setSelectedRoleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div>
      <h1 className="page-title">后台用户</h1>
      {error && <p className="error-text">{error}</p>}

      {canCreate ? (
        <form className="panel-form" onSubmit={(e) => void handleCreate(e)}>
          <h2 className="section-title">创建用户</h2>
          <div className="toolbar">
            <input
              placeholder="用户名"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="密码（至少 6 位）"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
            <input
              placeholder="昵称"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
            />
            <button type="submit">创建</button>
          </div>
        </form>
      ) : null}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>用户名</th>
            <th>昵称</th>
            <th>角色</th>
            <th>状态</th>
            {(canUpdate || canAssignRole) ? <th>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={(canUpdate || canAssignRole) ? 6 : 5}>暂无数据</td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.nickname ?? '—'}</td>
                <td>{(u.roleCodes ?? []).join(', ') || '—'}</td>
                <td>
                  <span className={`badge ${u.status === 'disabled' ? 'disabled' : 'ok'}`}>
                    {u.status}
                  </span>
                </td>
                {(canUpdate || canAssignRole) ? (
                  <td className="actions">
                    {canUpdate ? (
                      <select
                        value={u.status}
                        onChange={(e) => void updateStatus(u.id, e.target.value)}
                      >
                        <option value="active">active</option>
                        <option value="disabled">disabled</option>
                      </select>
                    ) : null}
                    {canAssignRole ? (
                      <button type="button" className="btn-secondary" onClick={() => openAssign(u)}>
                        分配角色
                      </button>
                    ) : null}
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {assigningId != null ? (
        <div className="modal-backdrop" onClick={() => setAssigningId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>分配角色</h3>
            <div className="check-list">
              {roles.map((r) => (
                <label key={r.id}>
                  <input
                    type="checkbox"
                    checked={selectedRoleIds.includes(r.id)}
                    onChange={() => toggleRole(r.id)}
                  />
                  {r.name} ({r.code})
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setAssigningId(null)}>
                取消
              </button>
              <button type="button" onClick={() => void saveRoles()}>保存</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
