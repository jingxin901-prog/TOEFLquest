import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { addDays, dateKeyInTimeZone } from '../lib/date'
import { generateWeek } from '../lib/planner'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { createId, type DailyCheckin, type LearnerProfile, type QuestData, type ScoreRecord, type StudySession, type StudyTask } from '../types'

const LOCAL_KEY = 'toefl-quest:data:v1'

function defaultProfile(): LearnerProfile {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai'
  const today = dateKeyInTimeZone(new Date(), timezone)
  return {
    name: '',
    currentScore: 4,
    targetScore: 5,
    examDate: addDays(today, 90),
    dailyMinutes: 50,
    weakSkill: 'speaking',
    topics: ['校园生活', '科技'],
    timezone,
    reminderTime: '20:00',
    onboardingComplete: false,
  }
}

function emptyData(): QuestData {
  return { profile: defaultProfile(), tasks: [], sessions: [], scores: [], checkins: [] }
}

function loadLocal(): QuestData {
  try {
    const saved = localStorage.getItem(LOCAL_KEY)
    if (!saved) return emptyData()
    const parsed = JSON.parse(saved) as Partial<QuestData>
    return {
      profile: { ...defaultProfile(), ...parsed.profile },
      tasks: parsed.tasks ?? [],
      sessions: parsed.sessions ?? [],
      scores: parsed.scores ?? [],
      checkins: parsed.checkins ?? [],
    }
  } catch {
    return emptyData()
  }
}

type TaskInput = Omit<StudyTask, 'id' | 'createdAt'> & { id?: string; createdAt?: string }

interface QuestStoreValue extends QuestData {
  user: User | null
  cloudEnabled: boolean
  syncStatus: 'local' | 'syncing' | 'synced' | 'error'
  saveProfile: (profile: LearnerProfile) => Promise<void>
  saveTask: (task: TaskInput) => Promise<StudyTask>
  removeTask: (id: string) => Promise<void>
  setTaskStatus: (id: string, status: StudyTask['status']) => Promise<void>
  saveSession: (session: Omit<StudySession, 'id'>) => Promise<void>
  saveScore: (score: Omit<ScoreRecord, 'id'>) => Promise<void>
  saveCheckin: (checkin: DailyCheckin) => Promise<void>
  createWeekPlan: (startDate: string, completionRate?: number, profileOverride?: LearnerProfile) => Promise<void>
  replanIncomplete: (throughDate: string) => Promise<number>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const QuestStore = createContext<QuestStoreValue | null>(null)

const taskToRow = (task: StudyTask, userId: string) => ({
  id: task.id,
  user_id: userId,
  title: task.title,
  description: task.description,
  scheduled_date: task.scheduledDate,
  skill: task.skill,
  duration_minutes: task.durationMinutes,
  status: task.status,
  source: task.source,
  completed_at: task.completedAt ?? null,
  created_at: task.createdAt,
  rescheduled_from: task.rescheduledFrom ?? null,
})

export function QuestStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<QuestData>(() => loadLocal())
  const [user, setUser] = useState<User | null>(null)
  const [syncStatus, setSyncStatus] = useState<QuestStoreValue['syncStatus']>('local')

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getUser().then(({ data: authData }) => setUser(authData.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !user) return
    let cancelled = false
    async function hydrateCloud() {
      setSyncStatus('syncing')
      const [profileResult, tasksResult, sessionsResult, scoresResult, checkinsResult] = await Promise.all([
        supabase!.from('profiles').select('*').eq('id', user!.id).maybeSingle(),
        supabase!.from('tasks').select('*').order('scheduled_date'),
        supabase!.from('study_sessions').select('*').order('started_at'),
        supabase!.from('score_records').select('*').order('recorded_date'),
        supabase!.from('daily_checkins').select('*').order('checkin_date'),
      ])
      if (cancelled) return
      const failed = [profileResult, tasksResult, sessionsResult, scoresResult, checkinsResult].some((result) => result.error)
      if (failed) {
        setSyncStatus('error')
        return
      }
      const row = profileResult.data
      if (!row) {
        const localProfile = data.profile
        const profileUpload = await supabase!.from('profiles').upsert({
          id: user!.id,
          display_name: localProfile.name,
          current_score: localProfile.currentScore,
          target_score: localProfile.targetScore,
          exam_date: localProfile.examDate,
          daily_minutes: localProfile.dailyMinutes,
          weak_skill: localProfile.weakSkill,
          topics: localProfile.topics,
          timezone: localProfile.timezone,
          reminder_time: localProfile.reminderTime,
          onboarding_complete: localProfile.onboardingComplete,
        })
        const taskUpload = data.tasks.length ? await supabase!.from('tasks').upsert(data.tasks.map((task) => taskToRow(task, user!.id))) : null
        const sessionUpload = data.sessions.length ? await supabase!.from('study_sessions').upsert(data.sessions.map((session) => ({
          id: session.id, user_id: user!.id, task_id: session.taskId ?? null, skill: session.skill, mode: session.mode,
          started_at: session.startedAt, ended_at: session.endedAt, duration_minutes: session.durationMinutes,
        }))) : null
        const scoreUpload = data.scores.length ? await supabase!.from('score_records').upsert(data.scores.map((score) => ({
          id: score.id, user_id: user!.id, recorded_date: score.date, score_type: score.type, overall: score.overall,
          reading: score.reading ?? null, listening: score.listening ?? null, speaking: score.speaking ?? null,
          writing: score.writing ?? null, note: score.note ?? null,
        }))) : null
        const checkinUpload = data.checkins.length ? await supabase!.from('daily_checkins').upsert(data.checkins.map((checkin) => ({
          user_id: user!.id, checkin_date: checkin.date, energy: checkin.energy, note: checkin.note ?? null,
        }))) : null
        setSyncStatus([profileUpload, taskUpload, sessionUpload, scoreUpload, checkinUpload].some((result) => result?.error) ? 'error' : 'synced')
        return
      }
      setData({
        profile: {
          id: row.id,
          name: row.display_name ?? '',
          currentScore: Number(row.current_score),
          targetScore: Number(row.target_score),
          examDate: row.exam_date,
          dailyMinutes: row.daily_minutes,
          weakSkill: row.weak_skill,
          topics: row.topics ?? [],
          timezone: row.timezone,
          reminderTime: row.reminder_time ?? '20:00',
          onboardingComplete: row.onboarding_complete,
        },
        tasks: (tasksResult.data ?? []).map((task) => ({
          id: task.id, userId: task.user_id, title: task.title, description: task.description,
          scheduledDate: task.scheduled_date, skill: task.skill, durationMinutes: task.duration_minutes,
          status: task.status, source: task.source, completedAt: task.completed_at ?? undefined,
          createdAt: task.created_at, rescheduledFrom: task.rescheduled_from ?? undefined,
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
        checkins: (checkinsResult.data ?? []).map((checkin) => ({ date: checkin.checkin_date, energy: checkin.energy, note: checkin.note ?? undefined })),
      })
      setSyncStatus('synced')
    }
    hydrateCloud()
    return () => { cancelled = true }
  }, [user])

  const saveProfile = async (profile: LearnerProfile) => {
    setData((current) => ({ ...current, profile }))
    if (!supabase || !user) return
    setSyncStatus('syncing')
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      display_name: profile.name,
      current_score: profile.currentScore,
      target_score: profile.targetScore,
      exam_date: profile.examDate,
      daily_minutes: profile.dailyMinutes,
      weak_skill: profile.weakSkill,
      topics: profile.topics,
      timezone: profile.timezone,
      reminder_time: profile.reminderTime,
      onboarding_complete: profile.onboardingComplete,
    })
    setSyncStatus(error ? 'error' : 'synced')
  }

  const saveTask = async (input: TaskInput) => {
    const task: StudyTask = { ...input, id: input.id ?? createId(), createdAt: input.createdAt ?? new Date().toISOString() }
    setData((current) => ({ ...current, tasks: [...current.tasks.filter((item) => item.id !== task.id), task] }))
    if (supabase && user) {
      const { error } = await supabase.from('tasks').upsert(taskToRow(task, user.id))
      setSyncStatus(error ? 'error' : 'synced')
    }
    return task
  }

  const removeTask = async (id: string) => {
    setData((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }))
    if (supabase && user) await supabase.from('tasks').delete().eq('id', id)
  }

  const setTaskStatus = async (id: string, status: StudyTask['status']) => {
    const task = data.tasks.find((item) => item.id === id)
    if (!task) return
    await saveTask({ ...task, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined })
  }

  const saveSession = async (input: Omit<StudySession, 'id'>) => {
    const session: StudySession = { ...input, id: createId() }
    setData((current) => ({ ...current, sessions: [...current.sessions, session] }))
    if (supabase && user) {
      await supabase.from('study_sessions').insert({
        id: session.id, user_id: user.id, task_id: session.taskId ?? null, skill: session.skill,
        mode: session.mode, started_at: session.startedAt, ended_at: session.endedAt, duration_minutes: session.durationMinutes,
      })
    }
  }

  const saveScore = async (input: Omit<ScoreRecord, 'id'>) => {
    const score: ScoreRecord = { ...input, id: createId() }
    setData((current) => ({ ...current, scores: [...current.scores, score] }))
    if (supabase && user) {
      await supabase.from('score_records').insert({
        id: score.id, user_id: user.id, recorded_date: score.date, score_type: score.type,
        overall: score.overall, reading: score.reading ?? null, listening: score.listening ?? null,
        speaking: score.speaking ?? null, writing: score.writing ?? null, note: score.note ?? null,
      })
    }
  }

  const saveCheckin = async (checkin: DailyCheckin) => {
    setData((current) => ({ ...current, checkins: [...current.checkins.filter((item) => item.date !== checkin.date), checkin] }))
    if (supabase && user) {
      await supabase.from('daily_checkins').upsert({ user_id: user.id, checkin_date: checkin.date, energy: checkin.energy, note: checkin.note ?? null })
    }
  }

  const createWeekPlan = async (startDate: string, rate = 1, profileOverride?: LearnerProfile) => {
    const generated = generateWeek(profileOverride ?? data.profile, startDate, rate)
    const endDate = addDays(startDate, 6)
    const removable = data.tasks.filter((task) => task.source !== 'manual' && task.status === 'todo' && task.scheduledDate >= startDate && task.scheduledDate <= endDate)
    setData((current) => ({
      ...current,
      tasks: [...current.tasks.filter((task) => !removable.some((item) => item.id === task.id)), ...generated],
    }))
    if (supabase && user) {
      if (removable.length) await supabase.from('tasks').delete().in('id', removable.map((task) => task.id))
      await supabase.from('tasks').insert(generated.map((task) => taskToRow(task, user.id)))
    }
  }

  const replanIncomplete = async (throughDate: string) => {
    const incomplete = data.tasks.filter((task) => task.status === 'todo' && task.scheduledDate <= throughDate)
    const moved = incomplete.map((task, index) => ({
      ...task,
      scheduledDate: addDays(throughDate, 1 + (index % 2)),
      source: 'rescheduled' as const,
      rescheduledFrom: task.scheduledDate,
    }))
    setData((current) => ({ ...current, tasks: [...current.tasks.filter((task) => !incomplete.some((item) => item.id === task.id)), ...moved] }))
    if (supabase && user && moved.length) await supabase.from('tasks').upsert(moved.map((task) => taskToRow(task, user.id)))
    return moved.length
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

  const signOut = async () => { if (supabase) await supabase.auth.signOut() }

  const value = useMemo<QuestStoreValue>(() => ({
    ...data, user, cloudEnabled: isSupabaseConfigured, syncStatus,
    saveProfile, saveTask, removeTask, setTaskStatus, saveSession, saveScore, saveCheckin,
    createWeekPlan, replanIncomplete, signIn, signUp, signOut,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [data, user, syncStatus])

  return <QuestStore.Provider value={value}>{children}</QuestStore.Provider>
}

export function useQuestStore() {
  const store = useContext(QuestStore)
  if (!store) throw new Error('useQuestStore must be used within QuestStoreProvider')
  return store
}
