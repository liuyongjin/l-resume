import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { ApiResponse } from '../auth/types';

interface WorkflowItem {
  id: number;
  userId: number;
  username?: string | null;
  version: number;
  name: string;
  description?: string | null;
  isDefault: boolean;
  active: boolean;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

export function WorkflowsPage() {
  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [userId, setUserId] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: '0', size: '50' });
      if (userId.trim()) params.set('userId', userId.trim());
      if (q.trim()) params.set('q', q.trim());
      const res = await apiFetch<ApiResponse<WorkflowItem[]> & { meta?: { totalElements?: number } }>(
        `/admin/workflows?${params}`,
      );
      setItems(res.data ?? []);
      setTotal(res.meta?.totalElements ?? res.data?.length ?? 0);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [userId, q]);

  useEffect(() => { void load(); }, [load]);

  return (
    <div>
      <h1 className="page-title">工作流</h1>
      <p className="muted">查询全部前台用户的工作流定义（共 {total} 条）</p>
      <div className="toolbar">
        <input
          placeholder="用户 ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ width: 120 }}
        />
        <input
          placeholder="搜索名称"
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
            <th>用户</th>
            <th>名称</th>
            <th>版本</th>
            <th>默认</th>
            <th>状态</th>
            <th>更新时间</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={7}>暂无数据</td></tr>
          ) : (
            items.map((w) => (
              <tr key={w.id}>
                <td>{w.id}</td>
                <td>{w.username ?? w.userId}</td>
                <td>
                  <div>{w.name}</div>
                  {w.description ? <div className="muted">{w.description}</div> : null}
                </td>
                <td>{w.version}</td>
                <td>{w.isDefault ? '是' : '否'}</td>
                <td>
                  <span className={`badge ${w.active ? 'ok' : 'disabled'}`}>
                    {w.active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td>{w.updatedAt ? new Date(w.updatedAt).toLocaleString() : '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
