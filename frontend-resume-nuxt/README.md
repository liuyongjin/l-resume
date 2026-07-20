# frontend-resume-nuxt

[English](./README.en.md)

简流前台 Web 应用（Nuxt 4 + Vue 3 + Tailwind + shadcn-vue + Vue Flow）。

- 开发地址：http://localhost:3000
- API 代理：开发模式下 `/api/*` → `backend-resume-nest`（默认 `http://127.0.0.1:3001`，避免 Windows 上 `localhost` 走 IPv6 导致接口很慢）

## 启动

```bash
cd frontend-resume-nuxt
npm install
npm run dev
```

## 主要页面

| 路由 | 功能 |
|------|------|
| `/` | 首页 |
| `/login` | 登录 |
| `/templates` | 模板中心 |
| `/resume` | 我的简历 |
| `/editor/:id` | 可视化编辑器 |
| `/preview/:id` | 简历预览 / 导出 |
| `/workflow/execution` | 智能执行 |
| `/workflow/designer` | 工作流设计器 |

## 核心能力

- 多模板创建与实时预览
- 分区编辑、主题排版、导出
- 智能执行：上传简历 → Agent 工作流 → 多模板多语言输出
- 工作流可视化编排（Vue Flow）与版本管理
- 中英国际化、亮 / 暗色主题

## 依赖服务

启动前台前请确保：

1. `backend-resume-nest` 已运行（`:3001`）
2. 需要 AI / 工作流能力时，`backend-agent-python` 已运行（`:5001`）

## 相关文档

- [根 README](../README.md)
- [Nest API](../backend-resume-nest/README.md)
- [Agent 服务](../backend-agent-python/README.md)
