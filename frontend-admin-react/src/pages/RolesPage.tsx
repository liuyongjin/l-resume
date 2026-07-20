import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { AdminMenu, ApiResponse } from '../auth/types';

interface RoleRow {
  id: number;
  code: string;
  name: string;
  remark?: string | null;
  status: string;
  menuIds?: number[];
}

function flattenMenus(menus: AdminMenu[], depth = 0): Array<AdminMenu & { depth: number }> {
  const result: Array<AdminMenu & { depth: number }> = [];
  for (const m of menus) {
    result.push({ ...m, depth });
    if (m.children?.length) {
      result.push(...flattenMenus(m.children, depth + 1));
    }
  }
  return result;
}

export function RolesPage() {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('role:update');
  const canAssignMenu = hasPermission('role:assign-menu');

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [menuTree, setMenuTree] = useState<AdminMenu[]>([]);
  const [error, setError] = useState('');
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<ApiResponse<RoleRow[]>>('/admin/roles');
      setRoles(res.data ?? []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  const loadMenus = useCallback(async () => {
    try {
      const res = await apiFetch<ApiResponse<AdminMenu[]>>('/admin/menus');
      setMenuTree(res.data ?? []);
    } catch {
      /* ignore if no menu:list */
    }
  }, []);

  useEffect(() => {
    void load();
    if (canAssignMenu) void loadMenus();
  }, [load, loadMenus, canAssignMenu]);

  async function updateRole(id: number, patch: Partial<Pick<RoleRow, 'remark' | 'status'>>) {
    try {
      await apiFetch(`/admin/roles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openAssign(role: RoleRow) {
    setAssigningId(role.id);
    setSelectedMenuIds(role.menuIds ?? []);
  }

  function toggleMenu(id: number) {
    setSelectedMenuIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function saveMenus() {
    if (assigningId == null) return;
    try {
      await apiFetch(`/admin/roles/${assigningId}/menus`, {
        method: 'PUT',
        body: JSON.stringify({ menuIds: selectedMenuIds }),
      });
      setAssigningId(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const flatMenus = flattenMenus(menuTree);

  return (
    <div>
      <h1 className="page-title">角色管理</h1>
      {error && <p className="error-text">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>编码</th>
            <th>名称</th>
            <th>备注</th>
            <th>状态</th>
            {(canUpdate || canAssignMenu) ? <th>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {roles.length === 0 ? (
            <tr>
              <td colSpan={(canUpdate || canAssignMenu) ? 6 : 5}>暂无数据</td>
            </tr>
          ) : (
            roles.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.code}</td>
                <td>{r.name}</td>
                <td>
                  {canUpdate ? (
                    <input
                      className="inline-input"
                      defaultValue={r.remark ?? ''}
                      onBlur={(e) => {
                        const next = e.target.value;
                        if (next !== (r.remark ?? '')) {
                          void updateRole(r.id, { remark: next });
                        }
                      }}
                    />
                  ) : (
                    r.remark ?? '—'
                  )}
                </td>
                <td>
                  <span className={`badge ${r.status === 'disabled' ? 'disabled' : 'ok'}`}>
                    {r.status}
                  </span>
                </td>
                {(canUpdate || canAssignMenu) ? (
                  <td className="actions">
                    {canUpdate ? (
                      <select
                        value={r.status}
                        onChange={(e) => void updateRole(r.id, { status: e.target.value })}
                      >
                        <option value="active">active</option>
                        <option value="disabled">disabled</option>
                      </select>
                    ) : null}
                    {canAssignMenu ? (
                      <button type="button" className="btn-secondary" onClick={() => openAssign(r)}>
                        分配菜单
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
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <h3>分配菜单</h3>
            <div className="check-list">
              {flatMenus.map((m) => (
                <label key={m.id} style={{ paddingLeft: m.depth * 16 }}>
                  <input
                    type="checkbox"
                    checked={selectedMenuIds.includes(m.id)}
                    onChange={() => toggleMenu(m.id)}
                  />
                  <span className="menu-type-tag">{m.type}</span>
                  {m.name}
                  {m.permission ? <span className="muted"> · {m.permission}</span> : null}
                </label>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setAssigningId(null)}>
                取消
              </button>
              <button type="button" onClick={() => void saveMenus()}>保存</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
