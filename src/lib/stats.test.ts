import { describe, expect, it } from 'vitest'
import { completionRate, streak } from './stats'
import type { LearnerProfile, StudyTask } from '../types'

const profile = { timezone: 'Asia/Shanghai' } as LearnerProfile
const base = { title: '', description: '', skill: 'reading', durationMinutes: 10, source: 'manual', createdAt: '2026-10-01T00:00:00Z' } as const

describe('learning stats', () => {
  it('calculates completion rate from actual status', () => {
    const tasks = [
      { ...base, id: '1', scheduledDate: '2026-10-15', status: 'completed' },
      { ...base, id: '2', scheduledDate: '2026-10-15', status: 'todo' },
    ] as StudyTask[]
    expect(completionRate(tasks)).toBe(0.5)
  })

  it('does not count an opened task as a streak day', () => {
    const tasks = [{ ...base, id: '1', scheduledDate: '2026-10-15', status: 'todo' }] as StudyTask[]
    expect(streak(tasks, profile)).toBe(0)
  })
})
