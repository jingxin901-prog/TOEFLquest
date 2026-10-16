import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { addDays, dateKeyInTimeZone } from '../lib/date'
import { generateWeek } from '../lib/planner'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { createId, type DailyCheckin, type DataMode, type LearnerProfile, type QuestData, type ScoreRecord, type StudySession, type StudyTask } from '../types'

const LEGACY_KEY = 'toefl-quest:data:v1'
const REAL_KEY = 'toefl-quest:data:v2:real'
const DEMO_KEY = 'toefl-quest:data:v2:demo'
const MODE_KEY = 'toefl-quest:data-mode'

function defaultProfile(): LearnerProfile {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
  return {
    name: '', selfReportedLevel: '大学英语六级左右（自评，尚未诊断）', currentScore: null,
    targetScore: null, examDate: null, dailyMinutes: 50, prioritySkill: null,
    topics: ['校园生活', '科技'], timezone, reminderTime: '20:00',
    notificationsEnabled: false, quietHoursStart: '22:30', quietHoursEnd: '08:00',
    onboardingComplete: false,
  }
}

function normalizeProfile(profile?: Partial<LearnerProfile> & { weakSkill?: LearnerProfile['prioritySkill'] }): LearnerProfile {
  const fallback = defaultProfile()
  return {
    ...fallback, ...profile,
    selfReportedLevel: profile?.selfReportedLevel ?? fallback.selfReportedLevel,
    currentScore: profile?.currentScore ?? null, targetScore: profile?.targetScore ?? null,
    examDate: profile?.examDate ?? null,
    prioritySkill: profile?.prioritySkill ?? profile?.weakSkill ?? null,
    notificationsEnabled: profile?.notificationsEnabled ?? false,
    quietHoursStart: profile?.quietHoursStart ?? '22:30', quietHoursEnd: profile?.quietHoursEnd ?? '08:00',
  }
}

function emptyData(dataMode: DataMode = 'real'): QuestData {
  return { dataMode, profile: defaultProfile(), tasks: [], sessions: [], scores: [], checkins: [] }
}

function demoData(): QuestData {
  const profile = { ...defaultProfile(), name: 'Demo 学习者', onboardingComplete: true }
  const today = dateKeyInTimeZone(new Date(), profile.timezone)
  const tasks = generateWeek(profile, addDays(today, -2), 0.72).map((task, index) => ({
    ...task, id: `demo-task-${index}`, status: index < 4 ? 'completed' as const : 'todo' as const,
    completedAt: index < 4 ? new Date().toISOString() : undefined,
    completionMethod: index < 4 ? 'timer' as const : undefined,
  }))
  const checkins: DailyCheckin[] = [-2, -1].map((offset, index) => ({
    date: addDays(today, offset), energy: index ? 'steady' : 'low', habitQualified: true,
    verifiedMinutes: 10 + index * 20, method: 'timer',
  }))
  return { dataMode: 'demo', profile, tasks, sessions: [], scores: [], checkins }
}

function readSaved(key: string, mode: DataMode): QuestData | null {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return null
    const parsed = JSON.parse(saved) as Partial<QuestData>
    return {
      dataMode: mode,
      profile: normalizeProfile(parsed.profile),
      tasks: (parsed.tasks ?? []).map((task) => ({ ...task, isMinimumTask: task.isMinimumTask ?? false })),
      sessions: parsed.sessions ?? [], scores: parsed.scores ?? [],
      checkins: (parsed.checkins ?? []).map((checkin) => ({
        ...checkin, habitQualified: checkin.habitQualified ?? false,
        verifiedMinutes: checkin.verifiedMinutes ?? 0,
      })),
    }
  } catch { return null }
}

function loadLocal(): QuestData {
  const mode: DataMode = localStorage.getItem(MODE_KEY) === 'demo' ? 'demo' : 'real'
  const saved = readSaved(mode === 'demo' ? DEMO_KEY : REAL_KEY, mode)
  if (saved) return saved
  if (mode === 'demo') return demoData()
  const legacy = readSaved(LEGACY_KEY, 'real')
  return legacy ? { ...legacy, profile: { ...legacy.profile, currentScore: null, targetScore: null, prioritySkill: null } } : emptyData()
}

type TaskInput = Omit<StudyTask, 'id' | 'createdAt' | 'isMinimumTask'> & { id?: string; createdAt?: string; isMinimumTask?: boolean }

interface QuestStoreValue extends QuestData {
  user: User | null
  cloudEnabled: boolean
  syncStatus: 'local' | 'syncing' | 'synced' | 'error'
  saveProfile: (profile: LearnerProfile) => Promise<void>
  saveTask: (task: TaskInput) => Promise<StudyTask>
  removeTask: (id: string) => Promise<void>
  setTaskStatus: (id: string, status: StudyTask['status'], method?: StudyTask['completionMethod']) => Promise<void>
  saveSession: (session: Omit<StudySession, 'id'>) => Promise<void>
  saveScore: (score: Omit<ScoreRecord, 'id'>) => Promise<void>
  saveCheckin: (checkin: DailyCheckin) => Promise<void>
  createWeekPlan: (startDate: string, completionRate?: number, profileOverride?: LearnerProfile) => Promise<void>
  replanIncomplete: (throughDate: string) => Promise<number>
  switchDataMode: (mode: DataMode) => void
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const QuestStore = createContext<QuestStoreValue | null>(null)

const taskToRow = (task: StudyTask, userId: string) => ({
  id: task.id, user_id: userId, plan_id: task.planId ?? null, title: task.title,
  description: task.description, scheduled_date: task.scheduledDate, skill: task.skill,
  duration_minutes: task.durationMinutes, status: task.status, source: task.source,
  is_minimum_task: task.isMinimumTask, completion_method: task.completionMethod ?? null,
  completed_at: task.completedAt ?? null, created_at: task.createdAt,
  rescheduled_from: task.rescheduledFrom ?? null,
})

const sessionToRow = (session: StudySession, userId: string) => ({
  id: session.id, user_id: userId, task_id: session.taskId ?? null, skill: session.skill,
  mode: session.mode, started_at: session.startedAt, ended_at: session.endedAt,
  duration_minutes: session.durationMinutes,
})

export function QuestStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<QuestData>(() => loadLocal())
  const [user, setUser] = useState<User | null>(null)
  const [syncStatus, setSyncStatus] = useState<QuestStoreValue['syncStatus']>('local')

  useEffect(() => {
    localStorage.setItem(MODE_KEY, data.dataMode)
    localStorage.setItem(data.dataMode === 'demo' ? DEMO_KEY : REAL_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: authData }) => setUser(authData.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  const persistProfile = async (profile: LearnerProfile) => {
    if (!supabase || !user || data.dataMode === 'demo') return null
    const results = await Promise.all([
      supabase.from('user_profiles').upsert({
        id: user.id, display_name: profile.name, self_reported_level: profile.selfReportedLevel,
        current_score: profile.currentScore, topics: profile.topics, timezone: profile.timezone,
        onboarding_complete: profile.onboardingComplete,
      }),
      supabase.from('learning_goals').upsert({
        user_id: user.id, target_score: profile.targetScore, target_exam_date: profile.examDate,
        daily_minutes: profile.dailyMinutes, priority_skill: profile.prioritySkill,
        long_term_goal: '达到海外大学及研究生申请要求', status: 'active',
      }, { onConflict: 'user_id' }),
      supabase.from('notification_preferences').upsert({
        user_id: user.id, enabled: profile.notificationsEnabled, browser_enabled: profile.notificationsEnabled,
        reminder_time: profile.reminderTime, timezone: profile.timezone,
        quiet_hours_start: profile.quietHoursStart, quiet_hours_end: profile.quietHoursEnd,
      }, { onConflict: 'user_id' }),
    ])
    return results.some((result) => result.error) ? 'error' as const : 'synced' as const
  }

  useEffect(() => {
    if (!supabase || !user || data.dataMode === 'demo') return
    let cancelled = false
    async function hydrateCloud() {
      setSyncStatus('syncing')
      const [profileResult, goalResult, notificationResult, tasksResult, sessionsResult, scoresResult, checkinsResult] = await Promise.all([
        supabase!.from('user_profiles').select('*').eq('id', user!.id).maybeSingle(),
        supabase!.from('learning_goals').select('*').eq('user_id', user!.id).maybeSingle(),
        supabase!.from('notification_preferences').select('*').eq('user_id', user!.id).maybeSingle(),
        supabase!.from('daily_tasks').select('*').order('scheduled_date'),
        supabase!.from('study_sessions').select('*').order('started_at'),
        supabase!.from('score_records').select('*').order('recorded_date'),
        supabase!.from('checkins').select('*').order('checkin_date'),
      ])
      if (cancelled) return
      const results = [profileResult, goalResult, notificationResult, tasksResult, sessionsResult, scoresResult, checkinsResult]
      if (results.some((result) => result.error)) { setSyncStatus('error'); return }
      const row = profileResult.data
      if (!row) {
        await persistProfile(data.profile)
        if (data.tasks.length) await supabase!.from('daily_tasks').upsert(data.tasks.map((task) => taskToRow(task, user!.id)))
        if (data.sessions.length) await supabase!.from('study_sessions').upsert(data.sessions.map((session) => sessionToRow(session, user!.id)))
        if (data.scores.length) await supabase!.from('score_records').upsert(data.scores.map((score) => ({
          id: score.id, user_id: user!.id, recorded_date: score.date, score_type: score.type, overall: score.overall,
          reading: score.reading ?? null, listening: score.listening ?? null, speaking: score.speaking ?? null,
          writing: score.writing ?? null, note: score.note ?? null,
        })))
        if (data.checkins.length) await supabase!.from('checkins').upsert(data.checkins.map((checkin) => ({
          user_id: user!.id, checkin_date: checkin.date, energy: checkin.energy ?? null,
          habit_qualified: checkin.habitQualified, verified_minutes: checkin.verifiedMinutes,
          verification_method: checkin.method ?? null, note: checkin.note ?? null,
        })), { onConflict: 'user_id,checkin_date' })
        setSyncStatus('synced')
        return
      }
      const goal = goalResult.data
      const notification = notificationResult.data
      setData({
        dataMode: 'real',
        profile: normalizeProfile({
          id: row.id, name: row.display_name ?? '', selfReportedLevel: row.self_reported_level,
          currentScore: row.current_score == null ? null : Number(row.current_score),
          targetScore: goal?.target_score == null ? null : Number(goal.target_score),
          examDate: goal?.target_exam_date ?? null, dailyMinutes: goal?.daily_minutes ?? 50,
          prioritySkill: goal?.priority_skill ?? null, topics: row.topics ?? [], timezone: row.timezone,
          reminderTime: notification?.reminder_time?.slice(0, 5) ?? '20:00',
          notificationsEnabled: notification?.enabled ?? false,
          quietHoursStart: notification?.quiet_hours_start?.slice(0, 5) ?? '22:30',
          quietHoursEnd: notification?.quiet_hours_end?.slice(0, 5) ?? '08:00',
          onboardingComplete: row.onboarding_complete,
        }),
        tasks: (tasksResult.data ?? []).map((task) => ({
          id: task.id, userId: task.user_id, planId: task.plan_id ?? undefined, title: task.title,
          description: task.description, scheduledDate: task.scheduled_date, skill: task.skill,
          durationMinutes: task.duration_minutes, status: task.status, source: task.source,
          isMinimumTask: task.is_minimum_task, completionMethod: task.completion_method ?? undefined,
          completedAt: task.completed_at ?? undefined, createdAt: task.created_at,
          rescheduledFrom: task.rescheduled_from ?? undefined,
        })),
        sessions: (sessionsResult.data ?? []).map((session) => ({
          id: session.id, userId: session.user_id, taskId: session.task_id ?? undefined,
          skill: session.skill, mode: session.mode, startedAt: session.started_at,
          endedAt: session.ended_at, durationMinutes: session.duration_minutes,
        })),
        scores: (scoresResult.data ?? []).map((score) => ({
          id: score.id, userId: score.user_id, date: score.recorded_date, type: score.score_type,
          overall: Number(score.overall), reading: score.reading == null ? undefined : Number(score.reading),
          listening: score.listening == null ? undefined : Number(score.listening), speaking: score.speaking == null ? undefined : Number(score.speaking),
          writing: score.writing == null ? undefined : Number(score.writing), note: score.note ?? undefined,
        })),
        checkins: (checkinsResult.data ?? []).map((checkin) => ({
          date: checkin.checkin_date, energy: checkin.energy ?? undefined,
          habitQualified: checkin.habit_qualified, verifiedMinutes: checkin.verified_minutes,
          method: checkin.verification_method ?? undefined, note: checkin.note ?? undefined,
        })),
      })
      setSyncStatus('synced')
    }
    hydrateCloud()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, data.dataMode])

  const saveProfile = async (profile: LearnerProfile) => {
    setData((current) => ({ ...current, profile }))
    if (!supabase || !user || data.dataMode === 'demo') return
    setSyncStatus('syncing')
    setSyncStatus((await persistProfile(profile)) ?? 'local')
  }

  const saveTask = async (input: TaskInput) => {
    const task: StudyTask = { ...input, id: input.id ?? createId(), createdAt: input.createdAt ?? new Date().toISOString(), isMinimumTask: input.isMinimumTask ?? false }
    setData((current) => ({ ...current, tasks: [...current.tasks.filter((item) => item.id !== task.id), task] }))
    if (supabase && user && data.dataMode === 'real') {
      const { error } = await supabase.from('daily_tasks').upsert(taskToRow(task, user.id))
      setSyncStatus(error ? 'error' : 'synced')
    }
    return task
  }

  const removeTask = async (id: string) => {
    setData((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }))
    if (supabase && user && data.dataMode === 'real') await supabase.from('daily_tasks').delete().eq('id', id)
  }

  const setTaskStatus = async (id: string, status: StudyTask['status'], method?: StudyTask['completionMethod']) => {
    const task = data.tasks.find((item) => item.id === id)
    if (!task) return
    await saveTask({ ...task, status, completionMethod: status === 'completed' ? method ?? task.completionMethod : undefined, completedAt: status === 'completed' ? new Date().toISOString() : undefined })
  }

  const saveSession = async (input: Omit<StudySession, 'id'>) => {
    const session: StudySession = { ...input, id: createId() }
    setData((current) => ({ ...current, sessions: [...current.sessions, session] }))
    if (supabase && user && data.dataMode === 'real') {
      const { error } = await supabase.from('study_sessions').insert(sessionToRow(session, user.id))
      setSyncStatus(error ? 'error' : 'synced')
    }
  }

  const saveScore = async (input: Omit<ScoreRecord, 'id'>) => {
    const score: ScoreRecord = { ...input, id: createId() }
    setData((current) => ({ ...current, scores: [...current.scores, score] }))
    if (supabase && user && data.dataMode === 'real') await supabase.from('score_records').insert({
      id: score.id, user_id: user.id, recorded_date: score.date, score_type: score.type, overall: score.overall,
      reading: score.reading ?? null, listening: score.listening ?? null, speaking: score.speaking ?? null,
      writing: score.writing ?? null, note: score.note ?? null,
    })
  }

  const saveCheckin = async (input: DailyCheckin) => {
    const existing = data.checkins.find((item) => item.date === input.date)
    const checkin: DailyCheckin = {
      ...existing, ...input, habitQualified: Boolean(existing?.habitQualified || input.habitQualified),
      verifiedMinutes: Math.max(existing?.verifiedMinutes ?? 0, input.verifiedMinutes), energy: input.energy ?? existing?.energy,
    }
    setData((current) => ({ ...current, checkins: [...current.checkins.filter((item) => item.date !== checkin.date), checkin] }))
    if (supabase && user && data.dataMode === 'real') await supabase.from('checkins').upsert({
      user_id: user.id, checkin_date: checkin.date, energy: checkin.energy ?? null,
      habit_qualified: checkin.habitQualified, verified_minutes: checkin.verifiedMinutes,
      verification_method: checkin.method ?? null, note: checkin.note ?? null,
    }, { onConflict: 'user_id,checkin_date' })
  }

  const createWeekPlan = async (startDate: string, rate = 1, profileOverride?: LearnerProfile) => {
    const profile = profileOverride ?? data.profile
    const planId = createId()
    const generated = generateWeek(profile, startDate, rate).map((task) => ({ ...task, planId }))
    const endDate = addDays(startDate, 6)
    const removable = data.tasks.filter((task) => task.source !== 'manual' && task.status === 'todo' && task.scheduledDate >= startDate && task.scheduledDate <= endDate)
    setData((current) => ({ ...current, tasks: [...current.tasks.filter((task) => !removable.some((item) => item.id === task.id)), ...generated] }))
    if (supabase && user && data.dataMode === 'real') {
      await supabase.from('study_plans').insert({
        id: planId, user_id: user.id, mode: profile.dailyMinutes === 10 ? 'minimum' : profile.dailyMinutes === 90 ? 'sprint' : profile.dailyMinutes === 50 ? 'standard' : 'custom',
        daily_minutes: profile.dailyMinutes, start_date: startDate, end_date: endDate,
        status: 'active', source: 'local_rule', completion_rate_basis: rate,
      })
      if (removable.length) await supabase.from('daily_tasks').delete().in('id', removable.map((task) => task.id))
      await supabase.from('daily_tasks').insert(generated.map((task) => taskToRow(task, user.id)))
    }
  }

  const replanIncomplete = async (throughDate: string) => {
    const incomplete = data.tasks.filter((task) => task.status === 'todo' && task.scheduledDate <= throughDate)
    const moved = incomplete.map((task, index) => ({ ...task, scheduledDate: addDays(throughDate, 1 + (index % 2)), source: 'rescheduled' as const, rescheduledFrom: task.scheduledDate }))
    setData((current) => ({ ...current, tasks: [...current.tasks.filter((task) => !incomplete.some((item) => item.id === task.id)), ...moved] }))
    if (supabase && user && data.dataMode === 'real' && moved.length) await supabase.from('daily_tasks').upsert(moved.map((task) => taskToRow(task, user.id)))
    return moved.length
  }

  const switchDataMode = (mode: DataMode) => {
    if (mode === data.dataMode) return
    localStorage.setItem(MODE_KEY, mode)
    setData(readSaved(mode === 'demo' ? DEMO_KEY : REAL_KEY, mode) ?? (mode === 'demo' ? demoData() : emptyData()))
    setSyncStatus(mode === 'demo' || !user ? 'local' : 'syncing')
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) return '请先在 .env.local 配置 Supabase。'
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }
  const signUp = async (email: string, password: string) => {
    if (!supabase) return '请先在 .env.local 配置 Supabase。'
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message ?? null
  }
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    localStorage.removeItem(REAL_KEY)
    setData(emptyData('real'))
    setSyncStatus('local')
  }

  const value = useMemo<QuestStoreValue>(() => ({
    ...data, user, cloudEnabled: isSupabaseConfigured, syncStatus,
    saveProfile, saveTask, removeTask, setTaskStatus, saveSession, saveScore, saveCheckin,
    createWeekPlan, replanIncomplete, switchDataMode, signIn, signUp, signOut,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data, user, syncStatus])

  return <QuestStore.Provider value={value}>{children}</QuestStore.Provider>
}

export function useQuestStore() {
  const store = useContext(QuestStore)
  if (!store) throw new Error('useQuestStore must be used within QuestStoreProvider')
  return store
}
