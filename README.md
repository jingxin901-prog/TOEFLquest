# TOEFL Quest 2.0

面向 2026-01-21 之后新版 TOEFL iBT 的个人学习、监督与进步反馈系统。Sprint 1 已形成可实际使用的闭环：资料设置 → 周计划 → 月历任务 → 计时学习 → 明确完成 → 验证打卡 → 周统计 → 本机或 Supabase 持久化。

> **在线使用：** [打开 TOEFL Quest 2.0](https://jingxin901-prog.github.io/TOEFLquest/)
>
> 当前正式公开地址由 GitHub Pages 托管；ChatGPT Sites 版本保留为备用。

## Sprint 1 已完成

- 用户资料：保留“大学英语六级左右，自评、尚未诊断”的原始语义，不换算 TOEFL 分数；目标分数与考试日期可空
- 完整月历：月份切换、回到今天、日期选择、技能筛选、绿/黄/灰完成状态
- 任务 CRUD：添加、编辑、删除、延期补排、显式完成确认；打开页面不会自动完成
- 10 / 50 / 90 / 自定义分钟计划；每天单独生成一个 10 分钟保底任务
- “今天不想学”：直接启动当天保底或最短任务
- 自由计时与番茄计时；结束后保存 `study_sessions`
- 习惯打卡与任务完成率分开：保底任务可保留连续记录，但不会把标准计划显示为 100%
- 周统计、月完成率、累计时长、技能投入、真实考试/模考/AI 反馈分类
- 时区、提醒时间、通知开关、免打扰时段；未配置飞书时明确显示未发送
- 浅色/深色模式；桌面优先并通过移动端浏览器测试
- 真实数据与稳定 Demo 数据分库存储；Demo 不会同步到云端
- Supabase Auth + PostgreSQL + 全表 RLS；刷新和重新登录后从云端恢复记录

七天诊断、口语录音/写作草稿与自适应诊断报告属于 Sprint 2。数据库契约已经建立，但本版不会用随机分或硬编码分伪装诊断结果。

## 技术架构

- React 19 + TypeScript + Vite 7
- Tailwind CSS 4
- Supabase JS、Auth、PostgreSQL、Row Level Security
- Vitest + Testing Library
- Playwright（桌面 Chromium + Pixel 7 视口）
- HashRouter，兼容静态托管与 GitHub Pages

前端状态由 `QuestStoreProvider` 统一管理。无 Supabase 配置时写入版本化 `localStorage`；登录后按 `auth.uid()` 读写 Supabase。AI Key、`service_role` 与飞书 Webhook 绝不进入 `VITE_` 变量。

## Windows 本地运行

需要 Node.js 22+。

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

如果暂时没有 Supabase，可直接留空 `.env.local`，核心功能仍可本机持久化运行。设置页可切换到“演示数据”；演示与真实数据不会混在一起。

## Supabase 初始化

新项目推荐使用 Supabase CLI：

```powershell
supabase link --project-ref <your-project-ref>
supabase db push
```

也可以在 SQL Editor 执行 `supabase/schema.sql`。随后：

1. 在 Authentication 启用 Email 登录。
2. 把 Project URL 与 **anon key** 写入 `.env.local`。
3. 重启开发服务器，在“设置与同步”注册/登录。

迁移 `supabase/migrations/202610160001_sprint1_core.sql` 创建：

`user_profiles`、`learning_goals`、`study_plans`、`daily_tasks`、`study_sessions`、`checkins`、`diagnostic_tests`、`diagnostic_questions`、`diagnostic_attempts`、`skill_assessments`、`practice_submissions`、`vocabulary_items`、`notification_preferences`、`score_records`。

每张用户数据表都启用 RLS，并只允许当前 `auth.uid()` 访问自己的记录。系统诊断题可只读共享；用户自建题仍按用户隔离。

## 验证

```powershell
npm test
npm run test:e2e
npm run build
```

Playwright 验收会真实执行：首次设置、创建任务、启动/结束计时、完成任务、提交打卡、刷新页面并确认任务/完成状态/打卡均恢复；桌面和手机视口各跑一次。

## 部署

### GitHub Pages

仓库的 `.github/workflows/deploy.yml` 会执行单元测试、Playwright、生产构建并发布。仓库 Settings → Pages 选择 GitHub Actions，并按需添加：

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 其他静态托管

```powershell
npm run build
```

部署 `dist/` 即可。HashRouter 不要求服务器配置 SPA 回退。

## 目录

```text
src/components        月历、任务、计时、提醒与布局
src/hooks             本机/云端状态与计时状态
src/lib               日期、计划、统计与 Supabase 客户端
src/pages             Dashboard、日历、计划、分析、设置
supabase/migrations   可复现 PostgreSQL 迁移与 RLS
e2e                   Playwright Sprint 1 浏览器验收
docs                  架构与 Sprint 1–4 计划
```

完整设计与下一阶段清单见 `docs/ARCHITECTURE.md` 和 `docs/SPRINTS.md`。
