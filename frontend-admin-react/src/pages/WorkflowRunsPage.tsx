import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { ApiResponse } from '../auth/types';

interface WorkflowStep {
  id: number;
  stepOrder?: number | null;
  stepKey?: string | null;
  stepName?: string | null;
  stepCategory?: string | null;
  status: string;
  error?: string | null;
  durationMs?: number | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

interface WorkflowRun {
  id: string;
  userId: number;
  username?: string | null;
  workflowId?: number | null;
  workflowName?: string | null;
  runType: string;
  status: string;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  steps?: WorkflowStep[] | null;
}

export function WorkflowRunsPage() {
  const [items, setItems] = useState<WorkflowRun[]>([]);
  const [userId, setUserId] = useState('');
  const [workflowId, setWorkflowId] = useState('');
  const [status, setStatus] = useState('');
  const [runType, setRunType] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<WorkflowRun | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: '0', size: '50' });
      if (userId.trim()) params.set('userId', userId.trim());
      if (workflowId.trim()) params.set('workflowId', workflowId.trim());
      if (status) params.set('status', status);
      if (runType) params.set('runType', runType);
      if (q.trim()) params.set('q', q.trim());
      const res = await apiFetch<ApiResponse<WorkflowRun[]> & { meta?: { totalElements?: number } }>(
        `/admin/workflow-runs?${params}`,
      );
      setItems(res.data ?? []);
      setTotal(res.meta?.totalElements ?? res.data?.length ?? 0);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    }
  }, [userId, workflowId, status, runType, q]);

  useEffect(() => { void load(); }, [load]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await apiFetch<ApiResponse<WorkflowRun>>(`/admin/workflow-runs/${id}`);
      setDetail(res.data ?? null);
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">执行日志</h1>
      <p className="muted">工作流运行记录与步骤日志（共 {total} 条）</p>
      <div className="toolbar">
        <input
          placeholder="用户 ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ width: 100 }}
        />
        <input
          placeholder="工作流 ID"
          value={workflowId}
          onChange={(e) => setWorkflowId(e.target.value)}
          style={{ width: 100 }}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">全部状态</option>
          <option value="running">running</option>
          <option value="success">success</option>
          <option value="failed">failed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <select value={runType} onChange={(e) => setRunType(e.target.value)}>
          <option value="">全部类型</option>
          <option value="execute">execute</option>
          <option value="test">test</option>
        </select>
        <input
          placeholder="搜索 Run ID"
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
            <th>Run ID</th>
            <th>用户</th>
            <th>工作流</th>
            <th>类型</th>
            <th>状态</th>
            <th>开始时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={7}>暂无数据</td></tr>
          ) : (
            items.map((r) => (
              <tr key={r.id}>
                <td className="mono-cell">{r.id.slice(0, 8)}…</td>
                <td>{r.username ?? r.userId}</td>
                <td>{r.workflowName ?? r.workflowId ?? '—'}</td>
                <td>{r.runType}</td>
                <td>
                  <span className={`badge ${r.status === 'failed' ? 'disabled' : 'ok'}`}>
                    {r.status}
                  </span>
                </td>
                <td>{r.startedAt ? new Date(r.startedAt).toLocaleString() : '—'}</td>
                <td>
                  <button type="button" className="link-btn" onClick={() => void openDetail(r.id)}>
                    步骤日志
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {(detailLoading || detail) && (
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h2>运行详情</h2>
            <button type="button" onClick={() => setDetail(null)}>关闭</button>
          </div>
          {detailLoading && <p className="muted">加载中…</p>}
          {detail && (
            <>
              <p className="muted mono-cell">{detail.id}</p>
              {detail.errorMessage && <p className="error-text">{detail.errorMessage}</p>}
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>步骤</th>
                    <th>分类</th>
                    <th>状态</th>
                    <th>耗时(ms)</th>
                    <th>错误</th>
                  </tr>
                </thead>
                <tbody>
                  {(detail.steps ?? []).length === 0 ? (
                    <tr><td colSpan={6}>暂无步骤日志</td></tr>
                  ) : (
                    (detail.steps ?? []).map((s) => (
                      <tr key={s.id}>
                        <td>{s.stepOrder ?? '—'}</td>
                        <td>{s.stepName ?? s.stepKey ?? s.id}</td>
                        <td>{s.stepCategory ?? '—'}</td>
                        <td>{s.status}</td>
                        <td>{s.durationMs ?? '—'}</td>
                        <td>{s.error ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}
