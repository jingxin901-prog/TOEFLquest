export type Skill = 'reading' | 'listening' | 'speaking' | 'writing' | 'vocabulary'
export type TaskStatus = 'todo' | 'completed' | 'skipped'
export type PlanIntensity = 10 | 50 | 90 | 'custom'

export interface LearnerProfile {
  id?: string
  name: string
  currentScore: number
  targetScore: number
  examDate: string
  dailyMinutes: number
  weakSkill: Skill
  topics: string[]
  timezone: string
  reminderTime: string
  onboardingComplete: boolean
}

export interface StudyTask {
  id: string
  userId?: string
  title: string
  description: string
  scheduledDate: string
  skill: Skill
  durationMinutes: number
  status: TaskStatus
  source: 'manual' | 'rule' | 'rescheduled'
  completedAt?: string
  createdAt: string
  rescheduledFrom?: string
}

export interface StudySession {
  id: string
  userId?: string
  taskId?: string
  skill: Skill
  mode: 'focus' | 'pomodoro'
  startedAt: string
  endedAt: string
  durationMinutes: number
}

export interface ScoreRecord {
  id: string
  userId?: string
  date: string
  type: 'official' | 'mock' | 'ai'
  overall: number
  reading?: number
  listening?: number
  speaking?: number
  writing?: number
  note?: string
}

export interface DailyCheckin {
  date: string
  energy: 'low' | 'steady' | 'high'
  note?: string
}

export interface QuestData {
  profile: LearnerProfile
  tasks: StudyTask[]
  sessions: StudySession[]
  scores: ScoreRecord[]
  checkins: DailyCheckin[]
}

export const SKILL_META: Record<Skill, { label: string; short: string; color: string }> = {
  reading: { label: '阅读', short: 'R', color: '#397b62' },
  listening: { label: '听力', short: 'L', color: '#4d7da8' },
  speaking: { label: '口语', short: 'S', color: '#9b6a44' },
  writing: { label: '写作', short: 'W', color: '#7565a5' },
  vocabulary: { label: '词汇', short: 'V', color: '#9a7d32' },
}

export const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
