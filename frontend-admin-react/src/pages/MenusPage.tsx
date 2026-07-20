import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { AdminMenu, ApiResponse } from '../auth/types';

type FlatMenu = AdminMenu & { depth: number };

function flattenMenus(menus: AdminMenu[], depth = 0): FlatMenu[] {
  const result: FlatMenu[] = [];
  for (const m of menus) {
    result.push({ ...m, depth });
    if (m.children?.length) {
      result.push(...flattenMenus(m.children, depth + 1));
    }
  }
  return result;
}

export function MenusPage() {
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('menu:update');
  const [menus, setMenus] = useState<AdminMenu[]>([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminMenu | null>(null);
  const [form, setForm] = useState({
    name: '',
    path: '',
    permission: '',
    sortOrder: '0',
    visible: true,
    status: 'active',
  });

  const load = useCallback(async () => {
    try {
      const res = await apiFetch<ApiResponse<AdminMenu[]>>('/admin/menus');
      setMenus(res.data ?? []);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function openEdit(menu: AdminMenu) {
    setEditing(menu);
    setForm({
      name: menu.name,
      path: menu.path ?? '',
      permission: menu.permission ?? '',
      sortOrder: String(menu.sortOrder ?? 0),
      visible: menu.visible !== false,
      status: menu.status ?? 'active',
    });
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      await apiFetch(`/admin/menus/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          path: form.path || null,
          permission: form.permission || null,
          sortOrder: Number(form.sortOrder) || 0,
          visible: form.visible,
          status: form.status,
        }),
      });
      setEditing(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const rows = flattenMenus(menus);

  return (
    <div>
      <h1 className="page-title">菜单管理</h1>
      {error && <p className="error-text">{error}</p>}

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>名称</th>
            <th>类型</th>
            <th>路径</th>
            <th>权限码</th>
            {canUpdate ? <th>操作</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={canUpdate ? 6 : 5}>暂无数据</td></tr>
          ) : (
            rows.map((m) => (
              <tr key={m.id}>
                <td>{m.id}</td>
                <td style={{ paddingLeft: 12 + m.depth * 16 }}>{m.name}</td>
                <td><span className="menu-type-tag">{m.type}</span></td>
                <td>{m.path ?? '—'}</td>
                <td>{m.permission ?? '—'}</td>
                {canUpdate ? (
                  <td>
                    <button type="button" className="btn-secondary" onClick={() => openEdit(m)}>
                      编辑
                    </button>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {editing ? (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>编辑菜单 · {editing.name}</h3>
            <div className="form-grid">
              <label>
                名称
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label>
                路径
                <input value={form.path} onChange={(e) => setForm({ ...form, path: e.target.value })} />
              </label>
              <label>
                权限码
                <input value={form.permission} onChange={(e) => setForm({ ...form, permission: e.target.value })} />
              </label>
              <label>
                排序
                <input value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </label>
              <label>
                状态
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">active</option>
                  <option value="disabled">disabled</option>
                </select>
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                />
                可见
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>取消</button>
              <button type="button" onClick={() => void saveEdit()}>保存</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
