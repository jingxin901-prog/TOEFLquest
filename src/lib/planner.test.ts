import { describe, expect, it } from 'vitest'
import { generateTasksForDay, generateWeek } from './planner'
import type { LearnerProfile } from '../types'

const profile: LearnerProfile = { name: 'Test', currentScore: 4, targetScore: 5, examDate: '2026-12-01', dailyMinutes: 50, weakSkill: 'speaking', topics: ['科技'], timezone: 'Asia/Shanghai', reminderTime: '20:00', onboardingComplete: true }

describe('rule planner', () => {
  it('builds a 10-minute minimum action', () => {
    const tasks = generateTasksForDay(profile, '2026-10-16', 10)
    expect(tasks).toHaveLength(1)
    expect(tasks[0].durationMinutes).toBe(10)
    expect(tasks[0].skill).toBe('speaking')
  })

  it('builds seven days and reduces load after poor completion', () => {
    const tasks = generateWeek(profile, '2026-10-16', 0.4)
    expect(new Set(tasks.map((task) => task.scheduledDate)).size).toBe(7)
    const dayOne = tasks.filter((task) => task.scheduledDate === '2026-10-16')
    expect(dayOne.reduce((sum, task) => sum + task.durationMinutes, 0)).toBe(38)
  })
})
