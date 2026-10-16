import { CheckCircle2, Pause, Play, Square } from 'lucide-react'
import { useState } from 'react'
import { useTimer } from '../hooks/useTimer'
import { SKILL_META } from '../types'
import { Button, Modal } from './ui'

const formatTime = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

export function TimerDock() {
  const timer = useTimer()
  const [finishing, setFinishing] = useState(false)
  if (!timer.task) return null
  const targetSeconds = timer.mode === 'pomodoro' ? 25 * 60 : timer.task.durationMinutes * 60
  const progress = Math.min(100, (timer.elapsedSeconds / targetSeconds) * 100)
  const displaySeconds = timer.mode === 'pomodoro' ? Math.max(0, targetSeconds - timer.elapsedSeconds) : timer.elapsedSeconds
  const meta = SKILL_META[timer.task.skill]

  return <>
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(660px,calc(100%-24px))] -translate-x-1/2 rounded-2xl border border-[#cfe0d5] bg-[#163d2d] p-3 text-white shadow-[0_20px_60px_rgba(21,57,43,.28)] lg:bottom-6">
      <div className="flex items-center gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xs font-black">{meta.short}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{timer.task.title}</p><span className="shrink-0 text-[10px] text-white/55">{timer.mode === 'pomodoro' ? '番茄专注' : '自由计时'}</span></div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#7ed5a2] transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="w-[58px] text-right font-mono text-base font-bold tabular-nums">{formatTime(displaySeconds)}</div>
        <button onClick={timer.toggle} className="focus-ring grid size-10 place-items-center rounded-xl bg-white text-[#1d5c40] hover:bg-[#eff8f1]" aria-label={timer.running ? '暂停计时' : '继续计时'}>{timer.running ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
        <button onClick={() => { if (timer.running) timer.toggle(); setFinishing(true) }} className="focus-ring grid size-10 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" aria-label="结束计时"><Square size={16} fill="currentColor" /></button>
      </div>
    </div>
    <Modal open={finishing} onClose={() => setFinishing(false)} title="记录这次学习">
      <div className="text-center">
        <CheckCircle2 className="mx-auto text-[#2f865e]" size={42} />
        <p className="mt-4 text-3xl font-black text-[#1d382b]">{formatTime(timer.elapsedSeconds)}</p>
        <p className="mt-2 text-sm leading-6 text-[#6e7e75]">只打开任务不会自动完成。请选择“仅记录”或明确确认本任务已完成。</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={async () => { await timer.finish(false); setFinishing(false) }}>仅记录时长</Button>
          <Button onClick={async () => { await timer.finish(true); setFinishing(false) }}>记录并完成</Button>
        </div>
      </div>
    </Modal>
  </>
}
