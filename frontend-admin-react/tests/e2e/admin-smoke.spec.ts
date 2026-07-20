import { expect, test, type Page } from '@playwright/test';

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '123456';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByLabel('用户名').fill(ADMIN_USER);
  await page.getByLabel('密码').fill(ADMIN_PASS);
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: '仪表盘' })).toBeVisible();
}

test.describe('Admin 前端联调（真实 Java API）', () => {
  test('登录失败显示错误', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('用户名').fill(ADMIN_USER);
    await page.getByLabel('密码').fill('bad-password');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.locator('.error-text')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('登录后仪表盘加载真实统计', async ({ page }) => {
    await login(page);
    await expect(page.getByRole('main').getByText('今日 PV')).toBeVisible();
    await expect(page.getByRole('main').locator('.stat-card .label', { hasText: '前台用户' })).toBeVisible();
    await expect(page.getByRole('main').getByText('简历数')).toBeVisible();
    const values = page.locator('.stat-card .value');
    await expect(values.first()).not.toHaveText('—', { timeout: 10_000 });
  });

  test('侧边栏业务数据与系统管理页面可打开', async ({ page }) => {
    await login(page);

    const routes: Array<{ link: string | RegExp; heading: string }> = [
      { link: '前台用户', heading: '前台用户' },
      { link: '简历', heading: '简历' },
      { link: '工作流', heading: '工作流' },
      { link: '执行日志', heading: '执行日志' },
      { link: '后台用户', heading: '后台用户' },
      { link: '角色管理', heading: '角色管理' },
      { link: '菜单管理', heading: '菜单管理' },
    ];

    for (const r of routes) {
      await page.getByRole('link', { name: r.link, exact: true }).click();
      await expect(page.getByRole('heading', { name: r.heading })).toBeVisible();
      await expect(page.locator('.error-text')).toHaveCount(0);
      await expect(page.locator('.data-table')).toBeVisible();
    }
  });

  test('执行日志可打开步骤详情（若有数据）', async ({ page }) => {
    await login(page);
    await page.getByRole('link', { name: '执行日志', exact: true }).click();
    await expect(page.getByRole('heading', { name: '执行日志' })).toBeVisible();

    const detailBtn = page.getByRole('button', { name: '步骤日志' }).first();
    if (await detailBtn.count()) {
      await detailBtn.click();
      await expect(page.getByRole('heading', { name: '运行详情' })).toBeVisible();
    }
  });

  test('未登录访问受保护路由跳转登录页', async ({ page }) => {
    await page.goto('/users');
    await expect(page).toHaveURL(/\/login/);
  });
});
