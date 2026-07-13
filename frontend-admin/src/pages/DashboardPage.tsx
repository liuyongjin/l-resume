import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

interface Stats {
  totalUsers: number;
  adminUsers: number;
  activeUsers: number;
  disabledUsers: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ success: boolean; data: Stats }>('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div>
      <h1 className="page-title">仪表盘</h1>
      {error && <p className="error-text">{error}</p>}
      <div className="card-grid">
        <div className="stat-card"><div className="label">总用户</div><div className="value">{stats?.totalUsers ?? '—'}</div></div>
        <div className="stat-card"><div className="label">管理员</div><div className="value">{stats?.adminUsers ?? '—'}</div></div>
        <div className="stat-card"><div className="label">活跃</div><div className="value">{stats?.activeUsers ?? '—'}</div></div>
        <div className="stat-card"><div className="label">已禁用</div><div className="value">{stats?.disabledUsers ?? '—'}</div></div>
      </div>
    </div>
  );
}
