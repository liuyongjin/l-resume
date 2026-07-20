/**
 * 对真实 Java Admin API（默认 http://127.0.0.1:8088）的联调测试。
 * 不使用 mock；需本地 Java + PostgreSQL 已启动。
 */
import { beforeAll, describe, expect, it } from 'vitest';

const API_BASE = (process.env.ADMIN_API_URL || 'http://127.0.0.1:8088').replace(/\/$/, '');
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '123456';

type Json = Record<string, unknown>;

async function request(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<{ status: number; json: Json }> {
  const headers = new Headers(init.headers);
  if (init.token) headers.set('Authorization', `Bearer ${init.token}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  const text = await res.text();
  let json: Json = {};
  if (text) {
    try {
      json = JSON.parse(text) as Json;
    } catch {
      json = { raw: text };
    }
  }
  return { status: res.status, json };
}

async function login(username = ADMIN_USER, password = ADMIN_PASS) {
  const { status, json } = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  expect(status).toBe(200);
  expect(json.success).toBe(true);
  const data = json.data as { accessToken?: string };
  expect(data?.accessToken).toBeTruthy();
  return data.accessToken as string;
}

describe('Admin Java API 联调', () => {
  let token: string;

  beforeAll(async () => {
    const health = await fetch(`${API_BASE}/auth/login`, {
      method: 'OPTIONS',
    }).catch(() => null);
    // 探活：错误密码也应有 HTTP 响应
    const probe = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: '___probe___', password: 'x' }),
    });
    if (probe.status === 0 || health === null && probe.status >= 500) {
      throw new Error(`无法连接 Admin Java API: ${API_BASE}。请先启动 backend-admin-spring。`);
    }
    token = await login();
  }, 30_000);

  it('错误密码登录失败', async () => {
    const { status, json } = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: ADMIN_USER, password: 'wrong-password' }),
    });
    expect(status).toBeGreaterThanOrEqual(400);
    expect(json.success).not.toBe(true);
  });

  it('无 Token 访问受保护接口返回 401', async () => {
    const { status } = await request('/admin/me');
    expect(status).toBe(401);
  });

  it('GET /admin/me 返回用户、角色、权限与菜单树', async () => {
    const { status, json } = await request('/admin/me', { token });
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    const data = json.data as {
      username: string;
      roles: string[];
      permissions: string[];
      menus: Array<{ name: string; path?: string; children?: unknown[] }>;
    };
    expect(data.username).toBe(ADMIN_USER);
    expect(data.roles).toContain('SUPER_ADMIN');
    expect(data.permissions).toEqual(expect.arrayContaining([
      'dashboard:view',
      'front-user:list',
      'resume:list',
      'workflow:list',
      'workflow-run:list',
      'admin-user:list',
      'role:list',
      'menu:list',
    ]));
    expect(Array.isArray(data.menus)).toBe(true);
    expect(data.menus.length).toBeGreaterThan(0);
  });

  it('GET /admin/stats 返回真实统计字段', async () => {
    const { status, json } = await request('/admin/stats', { token });
    expect(status).toBe(200);
    const data = json.data as Record<string, unknown>;
    for (const key of ['totalUsers', 'activeUsers', 'resumeCount', 'todayPv', 'todayUv', 'totalPv', 'totalUv']) {
      expect(data).toHaveProperty(key);
      expect(typeof data[key]).toBe('number');
    }
    expect(Array.isArray(data.last7Days)).toBe(true);
  });

  it('前台用户列表可查询', async () => {
    const { status, json } = await request('/admin/front-users?page=0&size=20', { token });
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.meta).toMatchObject({ page: 0 });
  });

  it('前台用户状态启停可恢复', async () => {
    const list = await request('/admin/front-users?page=0&size=1', { token });
    const users = list.json.data as Array<{ id: number; status: string }>;
    if (!users.length) {
      return; // 库中无前台用户时跳过写操作
    }
    const user = users[0];
    const original = user.status;
    const next = original === 'disabled' ? 'active' : 'disabled';

    const patched = await request(`/admin/front-users/${user.id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status: next }),
    });
    expect(patched.status).toBe(200);
    expect((patched.json.data as { status: string }).status).toBe(next);

    const restored = await request(`/admin/front-users/${user.id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status: original }),
    });
    expect(restored.status).toBe(200);
    expect((restored.json.data as { status: string }).status).toBe(original);
  });

  it('简历列表与详情', async () => {
    const list = await request('/admin/resumes?page=0&size=5', { token });
    expect(list.status).toBe(200);
    expect(Array.isArray(list.json.data)).toBe(true);
    const items = list.json.data as Array<{ id: number; userId: number; title: string }>;
    if (items.length) {
      const detail = await request(`/admin/resumes/${items[0].id}`, { token });
      expect(detail.status).toBe(200);
      expect((detail.json.data as { id: number }).id).toBe(items[0].id);
      expect((detail.json.data as { title: string }).title).toBeTruthy();
    }
  });

  it('工作流列表与详情', async () => {
    const list = await request('/admin/workflows?page=0&size=5', { token });
    expect(list.status).toBe(200);
    const items = list.json.data as Array<{ id: number; name: string }>;
    expect(Array.isArray(items)).toBe(true);
    if (items.length) {
      const detail = await request(`/admin/workflows/${items[0].id}`, { token });
      expect(detail.status).toBe(200);
      expect((detail.json.data as { id: number }).id).toBe(items[0].id);
    }
  });

  it('工作流执行日志列表与步骤详情', async () => {
    const list = await request('/admin/workflow-runs?page=0&size=5', { token });
    expect(list.status).toBe(200);
    const items = list.json.data as Array<{ id: string; status: string }>;
    expect(Array.isArray(items)).toBe(true);
    if (items.length) {
      const detail = await request(`/admin/workflow-runs/${items[0].id}`, { token });
      expect(detail.status).toBe(200);
      const data = detail.json.data as { id: string; steps: unknown[] };
      expect(data.id).toBe(items[0].id);
      expect(Array.isArray(data.steps)).toBe(true);
    }
  });

  it('后台用户：创建 / 分配角色 / 禁用', async () => {
    const username = `it_admin_${Date.now()}`;
    const created = await request('/admin/admin-users', {
      method: 'POST',
      token,
      body: JSON.stringify({
        username,
        password: 'test123456',
        nickname: '联调测试账号',
      }),
    });
    expect(created.status).toBe(200);
    const user = created.json.data as { id: number; username: string };
    expect(user.username).toBe(username);

    const rolesRes = await request('/admin/roles', { token });
    const roles = rolesRes.json.data as Array<{ id: number; code: string }>;
    const adminRole = roles.find((r) => r.code === 'ADMIN') ?? roles[0];
    expect(adminRole).toBeTruthy();

    const assigned = await request(`/admin/admin-users/${user.id}/roles`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ roleIds: [adminRole.id] }),
    });
    expect(assigned.status).toBe(200);
    expect((assigned.json.data as { roleCodes: string[] }).roleCodes).toContain(adminRole.code);

    const disabled = await request(`/admin/admin-users/${user.id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status: 'disabled' }),
    });
    expect(disabled.status).toBe(200);
    expect((disabled.json.data as { status: string }).status).toBe('disabled');
  });

  it('角色列表、备注更新可恢复、菜单分配可恢复', async () => {
    const rolesRes = await request('/admin/roles', { token });
    expect(rolesRes.status).toBe(200);
    const roles = rolesRes.json.data as Array<{
      id: number;
      code: string;
      remark: string | null;
      menuIds: number[];
    }>;
    const target = roles.find((r) => r.code === 'ADMIN');
    expect(target).toBeTruthy();
    if (!target) return;

    const originalRemark = target.remark ?? '';
    const originalMenus = [...(target.menuIds ?? [])];

    const patched = await request(`/admin/roles/${target.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ remark: `联调备注-${Date.now()}` }),
    });
    expect(patched.status).toBe(200);

    await request(`/admin/roles/${target.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ remark: originalRemark }),
    });

    const menusRes = await request('/admin/menus', { token });
    expect(menusRes.status).toBe(200);

    const assign = await request(`/admin/roles/${target.id}/menus`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ menuIds: originalMenus.length ? originalMenus : [1, 2] }),
    });
    expect(assign.status).toBe(200);

    // 恢复原始菜单
    await request(`/admin/roles/${target.id}/menus`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ menuIds: originalMenus }),
    });
  });

  it('菜单树与编辑可恢复', async () => {
    const menusRes = await request('/admin/menus', { token });
    expect(menusRes.status).toBe(200);
    const tree = menusRes.json.data as Array<{
      id: number;
      name: string;
      path?: string | null;
      permission?: string | null;
      sortOrder?: number;
      visible?: boolean;
      status?: string;
      children?: unknown[];
    }>;
    expect(tree.length).toBeGreaterThan(0);
    const leaf = tree[0];
    const originalName = leaf.name;

    const patched = await request(`/admin/menus/${leaf.id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ name: originalName }),
    });
    expect(patched.status).toBe(200);
    expect((patched.json.data as { name: string }).name).toBe(originalName);
  });
});
