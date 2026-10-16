import { describe, expect, it } from 'vitest'
import { generateTasksForDay, generateWeek } from './planner'
import type { LearnerProfile } from '../types'

const profile: LearnerProfile = { name: 'Test', selfReportedLevel: '六级左右（自评）', currentScore: null, targetScore: null, examDate: null, dailyMinutes: 50, prioritySkill: null, topics: ['科技'], timezone: 'Asia/Shanghai', reminderTime: '20:00', notificationsEnabled: false, quietHoursStart: '22:30', quietHoursEnd: '08:00', onboardingComplete: true }

describe('rule planner', () => {
  it('builds a 10-minute minimum action', () => {
    const tasks = generateTasksForDay(profile, '2026-10-16', 10)
    expect(tasks).toHaveLength(1)
    expect(tasks[0].durationMinutes).toBe(10)
    expect(tasks[0].skill).toBe('reading')
    expect(tasks[0].isMinimumTask).toBe(true)
  })

  it('builds seven days and reduces load after poor completion', () => {
    const tasks = generateWeek(profile, '2026-10-16', 0.4)
    expect(new Set(tasks.map((task) => task.scheduledDate)).size).toBe(7)
    const dayOne = tasks.filter((task) => task.scheduledDate === '2026-10-16')
    expect(dayOne.reduce((sum, task) => sum + task.durationMinutes, 0)).toBe(38)
    expect(dayOne.filter((task) => task.isMinimumTask)).toHaveLength(1)
  })

  it('does not assume a weak skill before diagnostic evidence exists', () => {
    const tasks = generateWeek(profile, '2026-10-16', 1)
    const covered = new Set(tasks.map((task) => task.skill))
    expect(['reading', 'listening', 'speaking', 'writing'].every((skill) => covered.has(skill as never))).toBe(true)
  })
})
