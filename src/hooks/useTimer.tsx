import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQuestStore } from './useQuestStore'
import type { StudyTask } from '../types'

interface TimerValue {
  task: StudyTask | null
  running: boolean
  elapsedSeconds: number
  mode: 'focus' | 'pomodoro'
  startTask: (task: StudyTask, mode?: 'focus' | 'pomodoro') => void
  toggle: () => void
  reset: () => void
  finish: (completeTask: boolean) => Promise<void>
}

const TimerContext = createContext<TimerValue | null>(null)

export function TimerProvider({ children }: { children: ReactNode }) {
  const store = useQuestStore()
  const [task, setTask] = useState<StudyTask | null>(null)
  const [running, setRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [mode, setMode] = useState<'focus' | 'pomodoro'>('focus')
  const startedAtRef = useRef<string | null>(null)

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setElapsedSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    if (mode === 'pomodoro' && elapsedSeconds >= 25 * 60) setRunning(false)
  }, [elapsedSeconds, mode])

  const startTask = (nextTask: StudyTask, nextMode: 'focus' | 'pomodoro' = 'focus') => {
    setTask(nextTask)
    setMode(nextMode)
    setElapsedSeconds(0)
    startedAtRef.current = new Date().toISOString()
    setRunning(true)
  }

  const reset = () => {
    setTask(null)
    setRunning(false)
    setElapsedSeconds(0)
    startedAtRef.current = null
  }

  const finish = async (completeTask: boolean) => {
    if (!task) return
    const endedAt = new Date().toISOString()
    const durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60))
    await store.saveSession({
      taskId: task.id,
      skill: task.skill,
      mode,
      startedAt: startedAtRef.current ?? endedAt,
      endedAt,
      durationMinutes,
    })
    if (completeTask) await store.setTaskStatus(task.id, 'completed', 'timer')
    reset()
  }

  const value = useMemo(() => ({ task, running, elapsedSeconds, mode, startTask, toggle: () => setRunning((value) => !value), reset, finish }), [task, running, elapsedSeconds, mode])
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>
}

export function useTimer() {
  const timer = useContext(TimerContext)
  if (!timer) throw new Error('useTimer must be used within TimerProvider')
  return timer
}
