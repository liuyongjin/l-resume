# frontend-mobile-flutter

简流前台 Flutter 客户端，功能对齐 `frontend-resume-nuxt` / `frontend-mobile-expo`（Expo），对接 **backend-resume-nest** 真实 API（无 mock）。

## 功能对照

| 模块 | 说明 | 对应 Expo / Web |
|------|------|-----------------|
| 登录 / 注册 | JWT，本地 Secure Storage 等价为 SharedPreferences | `(auth)/login`、`register` |
| 首页 Tab | 问候、Hero、快捷入口 | `(tabs)/index` |
| 工作流 Tab | 列表 + 执行 + 步骤轮询 | `(tabs)/workflow`、`workflow/run` |
| 简历 Tab | 列表 / 创建 / 删除 / 编辑 / 预览 | `(tabs)/resumes`、`resume/[id]` |
| 个人 Tab | 资料、退出 | `(tabs)/profile` |
| 模板 | 列表并用模板创建简历 | `templates/index` |
| AI 优化 | 文本优化入口 | `ai/index` |

## 环境要求

- Flutter SDK **3.16+**（Dart 3.2+）
- 本机已启动 `backend-resume-nest`（默认 `http://127.0.0.1:3001/api`）
- Android Emulator / Chrome / 真机均可

## 首次初始化平台工程

若缺少 `android/`、`ios/`、`web/` 目录，在本目录执行：

```bash
flutter create . --project-name frontend_mobile_flutter --org com.jianflow
```

## 启动

```bash
cd frontend-mobile-flutter
flutter pub get
# 可选：指定 API（真机请换成局域网 IP）
flutter run --dart-define=API_BASE_URL=http://127.0.0.1:3001/api
```

Windows 真机调试示例：

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:3001/api
```

## 测试

```bash
# 单元 / Widget 测试（Mock HTTP，不依赖 Nest）
flutter test

# 指定联调账号时跑 Nest 真实联调（可选）
flutter test test/integration/api_integration_test.dart \
  --dart-define=API_BASE_URL=http://127.0.0.1:3001/api \
  --dart-define=TEST_PHONE=你的手机号 \
  --dart-define=TEST_PASSWORD=你的密码
```

## 目录结构

```
lib/
  api/           # ApiClient + auth/resumes/templates/workflows/ai
  config/        # AppConfig (API_BASE_URL)
  models/        # Resume / Workflow / Template / User
  providers/     # Auth / Resume / Template / Workflow (Provider)
  router/        # go_router + Auth 守卫
  screens/       # 各功能页
  services/      # TokenStorage、工作流轮询
  theme/         # 主题色（对齐 Expo tokens）
  widgets/       # 通用组件
test/            # 模型、ApiClient、AuthProvider、轮询、登录页 Widget
```

## 分步实现汇总

| 阶段 | 内容 | 测试 |
|------|------|------|
| Phase 1 | 脚手架、主题、ApiClient、Auth、路由守卫 | `models_and_api_test`、`auth_provider_test` |
| Phase 2 | 首页 + 个人中心 Tab | `login_screen_test` |
| Phase 3 | 简历列表 / 编辑 / 预览 | Resume 模型解析测试 |
| Phase 4 | 模板库 | TemplateListResponse 测试 |
| Phase 5 | 工作流列表 / 执行 / 完成页 | `workflow_poll_test` |
| Phase 6 | AI 优化入口 | 页面调用 `AiApi` |
| Phase 7 | 测试套件 + README | `flutter test` |

## 说明

- API 契约与 Expo `src/api/*` 一致（`/auth`、`/resumes`、`/templates`、`/workflows`、`/ai`）。
- 工作流执行：`POST /workflows/:id/execute` → 轮询 `GET /workflows/executions/:groupId`。
- 本模块不依赖 Admin Java；仅前台 Nest API。
