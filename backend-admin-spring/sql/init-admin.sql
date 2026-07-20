-- 管理后台 RBAC 初始化（PostgreSQL，库 l_resume）
-- 用法: psql -U postgres -d l_resume -f backend-admin-java/sql/init-admin.sql

-- ========== 表结构 ==========
CREATE TABLE IF NOT EXISTS jf_admin_user (
  id          SERIAL PRIMARY KEY,
  username    VARCHAR(50)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  nickname    VARCHAR(100),
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jf_admin_role (
  id          SERIAL PRIMARY KEY,
  code        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  remark      VARCHAR(255),
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jf_admin_menu (
  id          SERIAL PRIMARY KEY,
  parent_id   INT          NOT NULL DEFAULT 0,
  name        VARCHAR(100) NOT NULL,
  type        VARCHAR(20)  NOT NULL, -- directory | menu | button
  path        VARCHAR(200),
  component   VARCHAR(200),
  permission  VARCHAR(100),
  icon        VARCHAR(50),
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     BOOLEAN      NOT NULL DEFAULT TRUE,
  status      VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jf_admin_user_role (
  user_id INT NOT NULL REFERENCES jf_admin_user(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES jf_admin_role(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS jf_admin_role_menu (
  role_id INT NOT NULL REFERENCES jf_admin_role(id) ON DELETE CASCADE,
  menu_id INT NOT NULL REFERENCES jf_admin_menu(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, menu_id)
);

CREATE TABLE IF NOT EXISTS jf_site_daily_stat (
  id          SERIAL PRIMARY KEY,
  stat_date   DATE         NOT NULL UNIQUE,
  pv          BIGINT       NOT NULL DEFAULT 0,
  uv          BIGINT       NOT NULL DEFAULT 0,
  new_users   INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ========== 角色 ==========
INSERT INTO jf_admin_role (id, code, name, remark, status, created_at, updated_at)
VALUES
  (1, 'SUPER_ADMIN', '超级管理员', '拥有全部后台权限', 'active', NOW(), NOW()),
  (2, 'ADMIN', '管理员', '常规运营管理', 'active', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, remark = EXCLUDED.remark, status = EXCLUDED.status;

-- ========== 菜单 / 按钮权限 ==========
-- id: 1 首页  2 前台用户  7 业务数据  8 简历  9 工作流  10 执行日志  3 系统管理 …
TRUNCATE jf_admin_role_menu, jf_admin_menu RESTART IDENTITY CASCADE;

INSERT INTO jf_admin_menu (id, parent_id, name, type, path, component, permission, icon, sort_order, visible, status, created_at, updated_at) VALUES
(1, 0, '首页', 'menu', '/', 'Dashboard', 'dashboard:view', 'home', 1, TRUE, 'active', NOW(), NOW()),
(2, 0, '前台用户', 'menu', '/users', 'FrontUsers', 'front-user:list', 'users', 2, TRUE, 'active', NOW(), NOW()),
(21, 2, '禁用/启用用户', 'button', NULL, NULL, 'front-user:status', NULL, 1, TRUE, 'active', NOW(), NOW()),
(7, 0, '业务数据', 'directory', '/biz', NULL, NULL, 'data', 3, TRUE, 'active', NOW(), NOW()),
(8, 7, '简历', 'menu', '/resumes', 'Resumes', 'resume:list', 'resume', 1, TRUE, 'active', NOW(), NOW()),
(9, 7, '工作流', 'menu', '/workflows', 'Workflows', 'workflow:list', 'workflow', 2, TRUE, 'active', NOW(), NOW()),
(10, 7, '执行日志', 'menu', '/workflow-runs', 'WorkflowRuns', 'workflow-run:list', 'log', 3, TRUE, 'active', NOW(), NOW()),
(3, 0, '系统管理', 'directory', '/system', NULL, NULL, 'settings', 4, TRUE, 'active', NOW(), NOW()),
(4, 3, '后台用户', 'menu', '/system/admins', 'AdminUsers', 'admin-user:list', 'admin', 1, TRUE, 'active', NOW(), NOW()),
(41, 4, '创建后台用户', 'button', NULL, NULL, 'admin-user:create', NULL, 1, TRUE, 'active', NOW(), NOW()),
(42, 4, '编辑后台用户', 'button', NULL, NULL, 'admin-user:update', NULL, 2, TRUE, 'active', NOW(), NOW()),
(43, 4, '分配角色', 'button', NULL, NULL, 'admin-user:assign-role', NULL, 3, TRUE, 'active', NOW(), NOW()),
(5, 3, '角色管理', 'menu', '/system/roles', 'Roles', 'role:list', 'role', 2, TRUE, 'active', NOW(), NOW()),
(51, 5, '编辑角色', 'button', NULL, NULL, 'role:update', NULL, 1, TRUE, 'active', NOW(), NOW()),
(52, 5, '分配菜单', 'button', NULL, NULL, 'role:assign-menu', NULL, 2, TRUE, 'active', NOW(), NOW()),
(6, 3, '菜单管理', 'menu', '/system/menus', 'Menus', 'menu:list', 'menu', 3, TRUE, 'active', NOW(), NOW()),
(61, 6, '编辑菜单', 'button', NULL, NULL, 'menu:update', NULL, 1, TRUE, 'active', NOW(), NOW());

SELECT setval('jf_admin_menu_id_seq', (SELECT MAX(id) FROM jf_admin_menu));

-- 超级管理员绑定全部菜单
INSERT INTO jf_admin_role_menu (role_id, menu_id)
SELECT 1, id FROM jf_admin_menu
ON CONFLICT DO NOTHING;

-- 普通管理员：首页 + 前台用户 + 业务数据查询
INSERT INTO jf_admin_role_menu (role_id, menu_id)
VALUES (2, 1), (2, 2), (2, 21), (2, 7), (2, 8), (2, 9), (2, 10)
ON CONFLICT DO NOTHING;

-- ========== 后台用户 admin / 123456 ==========
-- bcrypt: 123456
INSERT INTO jf_admin_user (id, username, password, nickname, status, created_at, updated_at)
VALUES (1, 'admin', '$2a$10$DZgcN5tJ/DuN9axEXWFrz.CH1TMYrIPR03WyvG08riQEv/GjiTsgK', '超级管理员', 'active', NOW(), NOW())
ON CONFLICT (username) DO UPDATE
  SET password = EXCLUDED.password,
      nickname = EXCLUDED.nickname,
      status = EXCLUDED.status,
      updated_at = NOW();

SELECT setval('jf_admin_user_id_seq', GREATEST((SELECT MAX(id) FROM jf_admin_user), 1));
SELECT setval('jf_admin_role_id_seq', GREATEST((SELECT MAX(id) FROM jf_admin_role), 1));

INSERT INTO jf_admin_user_role (user_id, role_id)
VALUES (1, 1)
ON CONFLICT DO NOTHING;

-- ========== 站点 PV/UV 示例数据（近 7 天） ==========
INSERT INTO jf_site_daily_stat (stat_date, pv, uv, new_users, created_at, updated_at)
VALUES
  (CURRENT_DATE - 6, 1200, 380, 12, NOW(), NOW()),
  (CURRENT_DATE - 5, 1450, 410, 15, NOW(), NOW()),
  (CURRENT_DATE - 4, 1320, 395, 9, NOW(), NOW()),
  (CURRENT_DATE - 3, 1680, 450, 18, NOW(), NOW()),
  (CURRENT_DATE - 2, 1900, 520, 22, NOW(), NOW()),
  (CURRENT_DATE - 1, 2100, 560, 25, NOW(), NOW()),
  (CURRENT_DATE, 860, 210, 8, NOW(), NOW())
ON CONFLICT (stat_date) DO UPDATE
  SET pv = EXCLUDED.pv, uv = EXCLUDED.uv, new_users = EXCLUDED.new_users, updated_at = NOW();
