# TOEFL Quest

一个面向新版 TOEFL iBT 的个人学习、打卡、计时与监督系统。界面使用中文，学习内容保留英文任务名；没有 AI Key 或 Supabase 时也能完整使用第一阶段功能。

## 当前可用功能（Phase 1）

- 首页 Dashboard、月历状态、日期选择和能力筛选
- 每日任务添加、编辑、删除、完成确认
- 自由计时 / 番茄模式数据模型、有效学习记录与显式完成
- 连续学习天数、本周学习天数、月度完成率、累计时长
- 10 / 50 / 90 分钟与自定义时长计划
- 未完成任务补排、根据完成率降低下一周负担
- 每日时长、技能投入、分类型成绩与周总结
- 浏览器提醒（仅页面打开时可靠）与数据导出
- Supabase Auth、PostgreSQL 持久化和 RLS

计划使用 2026-01-21 起的新版题型：Reading 的 Complete the Words / Read in Daily Life / Academic Passage，Listening 的 Response / Conversation / Announcement / Academic Talk，Writing 的 Build a Sentence / Email / Academic Discussion，以及 Speaking 的 Listen and Repeat / Take an Interview。分数按 1–6、0.5 增量处理。

## Windows 本地运行

需要 Node.js 22 或更高版本。

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

打开终端显示的本地 URL。未填写 `.env.local` 时，数据保存在当前浏览器的 `localStorage`。

## 配置 Supabase

1. 在 Supabase 新建项目。
2. 打开 SQL Editor，执行 `supabase/schema.sql`。
3. 在 Authentication 中启用 Email 登录；如不希望注册后验证邮箱，可在开发环境调整确认策略。
4. 复制 `.env.example` 为 `.env.local`，填写 Project URL 与 anon key。
5. 重启 `npm run dev`，在“设置与同步”中注册或登录。

只能在前端使用 Supabase **anon key**。不要把 `service_role`、AI Key 或飞书 Webhook 密钥放进任何 `VITE_` 环境变量。AI 与外部通知应由服务端代理调用。

## 验证

```powershell
npm test
npm run build
npm run preview
```

## 部署

### GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`。在仓库 Settings → Pages 中选择 GitHub Actions，并按需添加 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY` 两个 Actions secrets。推送到 `main` 后会自动测试、构建并部署。

### 其他静态托管

执行 `npm run build`，部署 `dist/`。项目使用 Hash Router，静态主机不需要额外的回退重写规则。

## 目录

```text
src/components  UI、月历、任务、计时与提醒
src/hooks       本地/云端状态与计时状态
src/lib         日期、计划、统计与 Supabase 客户端
src/pages       Dashboard、日历、计划、分析和设置
supabase        PostgreSQL 表、索引与 RLS
docs            架构与阶段规划
```

详细规划见 `docs/ARCHITECTURE.md`。
