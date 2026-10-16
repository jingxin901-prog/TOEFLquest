import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthGrid, monthLabel, moveMonth } from '../lib/date'
import type { StudyTask } from '../types'
import { Button } from './ui'

export function CalendarMonth({ month, selectedDate, today, tasks, onMonthChange, onSelectDate, compact = false }: {
  month: string
  selectedDate: string
  today: string
  tasks: StudyTask[]
  onMonthChange: (month: string) => void
  onSelectDate: (date: string) => void
  compact?: boolean
}) {
  const cells = monthGrid(month)
  const statusFor = (date: string) => {
    const dayTasks = tasks.filter((task) => task.scheduledDate === date)
    if (!dayTasks.length) return 'none'
    const completed = dayTasks.filter((task) => task.status === 'completed').length
    if (completed === dayTasks.length) return 'done'
    if (completed > 0) return 'partial'
    return 'todo'
  }

  return <div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button className="focus-ring rounded-xl border border-[#e1e8e3] bg-white p-2 text-[#607168] hover:bg-[#f3f7f4]" onClick={() => onMonthChange(moveMonth(month, -1))} aria-label="上一个月"><ChevronLeft size={17} /></button>
        <h2 className="min-w-[112px] text-center text-base font-extrabold">{monthLabel(month)}</h2>
        <button className="focus-ring rounded-xl border border-[#e1e8e3] bg-white p-2 text-[#607168] hover:bg-[#f3f7f4]" onClick={() => onMonthChange(moveMonth(month, 1))} aria-label="下一个月"><ChevronRight size={17} /></button>
      </div>
      <Button variant="secondary" className="!px-3 !py-2 text-xs" onClick={() => { onMonthChange(today.slice(0, 7)); onSelectDate(today) }}>回到今天</Button>
    </div>
    <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-[#8a978f] sm:gap-2">
      {['一', '二', '三', '四', '五', '六', '日'].map((day) => <div key={day} className="pb-1">{day}</div>)}
      {cells.map((date) => {
        const currentMonth = date.startsWith(month)
        const status = statusFor(date)
        const selected = date === selectedDate
        const day = Number(date.slice(-2))
        const dayTasks = tasks.filter((task) => task.scheduledDate === date)
        return <button key={date} onClick={() => onSelectDate(date)} className={`focus-ring group relative rounded-xl border text-left transition ${compact ? 'min-h-[58px] p-2' : 'min-h-[82px] p-2.5 sm:min-h-[96px]'} ${selected ? 'border-[#3b8662] bg-[#edf7ef] ring-2 ring-[#b9dcc5]' : 'border-[#e8eee9] bg-white hover:border-[#bfd7c7] hover:bg-[#f8fbf8]'} ${currentMonth ? '' : 'opacity-35'}`} aria-label={`${date}，${dayTasks.length} 个任务`}>
          <span className={`inline-grid size-6 place-items-center rounded-full text-xs font-bold ${date === today ? 'bg-[#255f45] text-white' : 'text-[#50645a]'}`}>{day}</span>
          {status !== 'none' && <div className={`absolute right-2 top-2 size-2 rounded-full ${status === 'done' ? 'bg-[#48a36d]' : status === 'partial' ? 'bg-[#e9b840]' : 'bg-[#c8cfca]'}`} />}
          {!compact && dayTasks.length > 0 && <div className="mt-2 space-y-1">
            {dayTasks.slice(0, 2).map((task) => <div key={task.id} className={`truncate rounded-md px-1.5 py-1 text-[10px] font-medium ${task.status === 'completed' ? 'bg-[#e5f5e9] text-[#307250] line-through opacity-70' : 'bg-[#f2f4f2] text-[#607168]'}`}>{task.title}</div>)}
            {dayTasks.length > 2 && <p className="px-1 text-[10px] text-[#93a098]">+{dayTasks.length - 2} 项</p>}
          </div>}
        </button>
      })}
    </div>
    <div className="mt-4 flex flex-wrap gap-4 text-[11px] text-[#75837b]">
      <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#48a36d]" />全部完成</span>
      <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#e9b840]" />部分完成</span>
      <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-[#c8cfca]" />未开始</span>
    </div>
  </div>
}
