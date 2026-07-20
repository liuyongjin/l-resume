import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { ApiResponse } from '../auth/types';

interface ResumeItem {
  id: number;
  userId: number;
  username?: string | null;
  title: string;
  templateId?: string | null;
  source?: string | null;
  favorite: boolean;
  shared: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function ResumesPage() {
  const [items, setItems] = useState<ResumeItem[]>([]);
  const [userId, setUserId] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: '0', size: '50' });
      if (userId.trim()) params.set('userId', userId.trim());
      if (q.trim()) params.set('q', q.trim());
      const res = await apiFetch<ApiResponse<ResumeItem[]> & { meta?: { totalElements?: number } }>(
        `/admin/resumes?${params}`,
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
      <h1 className="page-title">简历</h1>
      <p className="muted">查询全部前台用户的简历（共 {total} 条）</p>
      <div className="toolbar">
        <input
          placeholder="用户 ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ width: 120 }}
        />
        <input
          placeholder="搜索标题"
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
            <th>标题</th>
            <th>模板</th>
            <th>来源</th>
            <th>收藏</th>
            <th>分享</th>
            <th>更新时间</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={8}>暂无数据</td></tr>
          ) : (
            items.map((r) => (
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.username ?? r.userId}</td>
                <td>{r.title}</td>
                <td>{r.templateId ?? '—'}</td>
                <td>{r.source ?? '—'}</td>
                <td>{r.favorite ? '是' : '否'}</td>
                <td>{r.shared ? '是' : '否'}</td>
                <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
