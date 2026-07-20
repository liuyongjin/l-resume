import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import type { ApiResponse } from '../auth/types';

interface DayStat {
  date: string;
  pv: number;
  uv: number;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  resumeCount: number;
  todayPv: number;
  todayUv: number;
  totalPv: number;
  totalUv: number;
  last7Days: DayStat[];
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<ApiResponse<Stats>>('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((e: Error) => setError(e.message));
  }, []);

  const days = stats?.last7Days ?? [];

  return (
    <div>
      <h1 className="page-title">仪表盘</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="card-grid">
        <div className="stat-card">
          <div className="label">今日 PV</div>
          <div className="value">{stats?.todayPv ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">今日 UV</div>
          <div className="value">{stats?.todayUv ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">累计 PV</div>
          <div className="value">{stats?.totalPv ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">累计 UV</div>
          <div className="value">{stats?.totalUv ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">前台用户</div>
          <div className="value">{stats?.totalUsers ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">活跃用户</div>
          <div className="value">{stats?.activeUsers ?? '—'}</div>
        </div>
        <div className="stat-card">
          <div className="label">简历数</div>
          <div className="value">{stats?.resumeCount ?? '—'}</div>
        </div>
      </div>

      <h2 className="section-title">近 7 日 PV / UV</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>PV</th>
            <th>UV</th>
          </tr>
        </thead>
        <tbody>
          {days.length === 0 ? (
            <tr><td colSpan={3}>暂无数据</td></tr>
          ) : (
            days.map((d) => (
              <tr key={d.date}>
                <td>{d.date}</td>
                <td>{d.pv}</td>
                <td>{d.uv}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
