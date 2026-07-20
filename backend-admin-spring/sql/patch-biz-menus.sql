-- 增量：业务数据菜单（简历 / 工作流 / 执行日志）
-- 已执行过旧版 init-admin.sql 的环境可单独跑本脚本

INSERT INTO jf_admin_menu (id, parent_id, name, type, path, component, permission, icon, sort_order, visible, status, created_at, updated_at)
VALUES
(7, 0, '业务数据', 'directory', '/biz', NULL, NULL, 'data', 3, TRUE, 'active', NOW(), NOW()),
(8, 7, '简历', 'menu', '/resumes', 'Resumes', 'resume:list', 'resume', 1, TRUE, 'active', NOW(), NOW()),
(9, 7, '工作流', 'menu', '/workflows', 'Workflows', 'workflow:list', 'workflow', 2, TRUE, 'active', NOW(), NOW()),
(10, 7, '执行日志', 'menu', '/workflow-runs', 'WorkflowRuns', 'workflow-run:list', 'log', 3, TRUE, 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  parent_id = EXCLUDED.parent_id,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  path = EXCLUDED.path,
  component = EXCLUDED.component,
  permission = EXCLUDED.permission,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  visible = EXCLUDED.visible,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 系统管理目录顺延到 sort 4（若仍为 3）
UPDATE jf_admin_menu SET sort_order = 4, updated_at = NOW() WHERE id = 3 AND sort_order < 4;

SELECT setval('jf_admin_menu_id_seq', GREATEST((SELECT MAX(id) FROM jf_admin_menu), 1));

INSERT INTO jf_admin_role_menu (role_id, menu_id)
SELECT 1, m.id FROM jf_admin_menu m WHERE m.id IN (7, 8, 9, 10)
ON CONFLICT DO NOTHING;

INSERT INTO jf_admin_role_menu (role_id, menu_id)
VALUES (2, 7), (2, 8), (2, 9), (2, 10)
ON CONFLICT DO NOTHING;
