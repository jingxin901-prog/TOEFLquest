# TOEFL Quest 2.0 架构

## 现有架构总结

1. **体验层**：React 页面与组件，`HashRouter` 兼容静态托管；PC 使用侧栏，移动端使用底部导航。
2. **领域层**：计划生成、用户时区日期、任务完成率、习惯连续天数和学习时长统计均为纯 TypeScript，可由 Vitest 单独验证。
3. **状态层**：`QuestStoreProvider` 管理资料、任务、会话、打卡与成绩；`TimerProvider` 只负责当前计时状态，并在结束时写入学习会话。
4. **持久化层**：本机真实数据、Demo 数据使用不同版本化 key；配置 Supabase 后，真实数据经 Auth + PostgreSQL 同步，登录时重新水合。
5. **安全层**：所有用户数据关联 `user_id`；数据库开启 RLS。浏览器只允许 anon key；AI、`service_role`、飞书 Webhook 只允许进入服务端环境。
6. **质量层**：Vitest 覆盖计划/统计/组件闭环，Playwright 覆盖桌面与移动端的创建、计时、完成、打卡和刷新恢复。

## 关键领域规则

- “大学英语六级左右”是自评文字，不转换为 TOEFL 分数。
- 目标 TOEFL 分数与考试日期可以为空。
- 无诊断证据时 `prioritySkill = null`，计划保持听说读写基本覆盖。
- 每个学习日有独立 `isMinimumTask` 保底任务；习惯打卡与目标任务完成率分别计算。
- 选择能量状态不构成打卡。打卡需要计时记录或明确完成确认。
- 页面打开、计时开始都不自动完成任务；完成来源记录为 `timer` 或 `manual_confirmation`。
- `official`、`mock`、`ai` 记录严格分类；AI 反馈不用于官方目标差距。
- 日期归属、今天与连续记录均使用用户配置的 IANA 时区。

## 数据关系

```text
auth.users
  ├─ user_profiles (1:1)
  ├─ learning_goals (1:1 active goal)
  ├─ notification_preferences (1:1)
  ├─ study_plans ──< daily_tasks ──< study_sessions
  ├─ checkins
  ├─ diagnostic_tests ──< diagnostic_attempts >── diagnostic_questions
  ├─ skill_assessments
  ├─ practice_submissions
  ├─ vocabulary_items
  └─ score_records
```

诊断的口语/写作提交在 `review_status = pending_human_or_ai` 时不得生成能力分；后续人工或可靠 AI 评估完成后才能变更为 `reviewed`。

## 官方考试基线

系统按 ETS 2026 Test Blueprint 建模新版题型：

- Reading：Complete the Words、Read in Daily Life、Read an Academic Passage
- Listening：Listen and Choose a Response、Conversation、Announcement、Academic Talk
- Speaking：Listen and Repeat、Take an Interview
- Writing：Build a Sentence、Write an Email、Academic Discussion
- 2026-01-21 起正式成绩采用 1–6、0.5 步进

题库只使用原创内容或用户有权导入的材料，不复制 ETS 付费试题。
