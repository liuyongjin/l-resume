# 分步实现记录

## Phase 1 — 基础

- [x] `pubspec.yaml`（go_router / provider / http / shared_preferences）
- [x] `ApiClient` + TokenStorage + 401 回调
- [x] Auth API / AuthProvider / 登录注册页
- [x] go_router Auth 守卫 + 底部 Tab Shell
- [x] 主题色对齐 Expo `#7C3AED`

**测试：** `test/models_and_api_test.dart`、`test/auth_provider_test.dart`

## Phase 2 — 首页与个人

- [x] HomeScreen（Hero + 快捷入口）
- [x] ProfileScreen（用户信息 + 退出）

**测试：** `test/login_screen_test.dart`

## Phase 3 — 简历

- [x] 列表 / 搜索 / 创建 / 删除
- [x] 编辑（标题 + 基本信息 + 总结）
- [x] 预览

**测试：** Resume.fromJson / ResumeListResponse

## Phase 4 — 模板

- [x] TemplatesScreen + 使用模板创建简历

**测试：** TemplateListResponse.fromJson

## Phase 5 — 工作流

- [x] 工作流列表
- [x] 执行页（目标岗位 + 步骤日志）
- [x] 完成页跳转简历预览
- [x] `WorkflowExecutionPoll`

**测试：** `test/workflow_poll_test.dart`

## Phase 6 — AI

- [x] AiHubScreen（`/ai/optimize`）

## Phase 7 — 汇总

- [x] README + 本文件
- [x] 平台目录（android/ios/web/windows）via `flutter create`
- [x] Flutter SDK 3.24.5 本地验证
- [x] `flutter analyze`：No issues found
- [x] `flutter test`：14 passed · 1 skipped（未配置 TEST_PHONE 的 Nest 写联调）

## 后续可增强（非本次范围）

- 简历分段完整表单（教育 / 工作 / 项目）
- 工作流设计器可视化
- AI 会话流式输出
- i18n
