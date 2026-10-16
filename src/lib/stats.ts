import { addDays, dateKeyInTimeZone, startOfWeek } from './date'
import type { DailyCheckin, LearnerProfile, Skill, StudySession, StudyTask } from '../types'

export function completionRate(tasks: StudyTask[], from?: string, to?: string) {
  const scoped = tasks.filter((task) => (!from || task.scheduledDate >= from) && (!to || task.scheduledDate <= to))
  if (!scoped.length) return 0
  return scoped.filter((task) => task.status === 'completed').length / scoped.length
}

export function totalMinutes(sessions: StudySession[]) {
  return sessions.reduce((sum, session) => sum + session.durationMinutes, 0)
}

export function streak(checkins: DailyCheckin[], profile: LearnerProfile) {
  const completedDays = new Set(checkins.filter((checkin) => checkin.habitQualified).map((checkin) => checkin.date))
  let cursor = dateKeyInTimeZone(new Date(), profile.timezone)
  if (!completedDays.has(cursor)) cursor = addDays(cursor, -1)
  let count = 0
  while (completedDays.has(cursor)) {
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

export function weeklyStudyDays(checkins: DailyCheckin[], today: string) {
  const start = startOfWeek(today)
  const end = addDays(start, 6)
  return new Set(checkins.filter((checkin) => checkin.habitQualified && checkin.date >= start && checkin.date <= end).map((checkin) => checkin.date)).size
}

export function skillMinutes(sessions: StudySession[]) {
  const result: Record<Skill, number> = { reading: 0, listening: 0, speaking: 0, writing: 0, vocabulary: 0 }
  sessions.forEach((session) => { result[session.skill] += session.durationMinutes })
  return result
}

export function dailyMinutes(sessions: StudySession[], endDate: string, dayCount = 14) {
  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(endDate, index - dayCount + 1)
    const minutes = sessions
      .filter((session) => session.startedAt.slice(0, 10) === date)
      .reduce((sum, session) => sum + session.durationMinutes, 0)
    return { date, minutes }
  })
}
