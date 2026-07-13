# frontend-mobile

简流移动端 App（Expo + React Native），对接 `backend-nest` 真实 API。

## 启动

```bash
npm install
cp .env.example .env
npm start
```

## 环境变量

```
EXPO_PUBLIC_API_URL=http://<你的局域网IP>:3001/api
```

## 功能

- 登录 / 注册（JWT）
- 简历列表、编辑、预览
- AI 优化（经 Nest `/api/multiagent` 转发至 `backend-agent-python`）
- 工作流执行（轮询真实执行日志）
- 模板选择

## 说明

Windows 路径含中文时，可用 junction 启动：

```powershell
mklink /J C:\jianflow-expo "E:\...\l-resume\frontend-mobile"
cd C:\jianflow-expo && npx expo start --lan
```
