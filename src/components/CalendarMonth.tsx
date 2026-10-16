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
      <div className="flex items-center gap-1.5 rounded-full border border-[#dfe5e0] bg-[#f8faf7] p-1">
        <button className="focus-ring grid size-8 place-items-center rounded-full text-[#607168] transition hover:bg-white hover:shadow-sm" onClick={() => onMonthChange(moveMonth(month, -1))} aria-label="上一个月"><ChevronLeft size={16} /></button>
        <h2 className="min-w-[104px] text-center text-sm font-extrabold tracking-[-.01em]">{monthLabel(month)}</h2>
        <button className="focus-ring grid size-8 place-items-center rounded-full text-[#607168] transition hover:bg-white hover:shadow-sm" onClick={() => onMonthChange(moveMonth(month, 1))} aria-label="下一个月"><ChevronRight size={16} /></button>
      </div>
      <Button variant="secondary" className="!px-3 !py-2 text-xs" onClick={() => { onMonthChange(today.slice(0, 7)); onSelectDate(today) }}>回到今天</Button>
    </div>
    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#8a978f] sm:gap-1.5">
      {['一', '二', '三', '四', '五', '六', '日'].map((day) => <div key={day} className="pb-2 uppercase tracking-wider">{day}</div>)}
      {cells.map((date) => {
        const currentMonth = date.startsWith(month)
        const status = statusFor(date)
        const selected = date === selectedDate
        const day = Number(date.slice(-2))
        const dayTasks = tasks.filter((task) => task.scheduledDate === date)
        return <button key={date} onClick={() => onSelectDate(date)} className={`focus-ring group relative border text-left transition duration-150 ${compact ? 'min-h-[54px] rounded-[10px] p-1.5 sm:min-h-[60px] sm:p-2' : 'min-h-[78px] rounded-xl p-2 sm:min-h-[92px] sm:p-2.5'} ${selected ? 'border-[#3a7f5d] bg-[#edf5ed] shadow-[inset_0_0_0_1px_rgba(58,127,93,.18)]' : 'border-transparent bg-[#f7f9f6] hover:border-[#c7d8cc] hover:bg-white'} ${currentMonth ? '' : 'opacity-30'}`} aria-label={`${date}，${dayTasks.length} 个任务`}>
          <span className={`inline-grid size-6 place-items-center rounded-full text-[11px] font-bold ${date === today ? 'bg-[#1f6044] text-white' : selected ? 'text-[#276646]' : 'text-[#53645b]'}`}>{day}</span>
          {status !== 'none' && <div className={`absolute right-2 top-2 size-1.5 rounded-full ${status === 'done' ? 'bg-[#47a16b]' : status === 'partial' ? 'bg-[#e5b43f]' : 'bg-[#bdc6bf]'}`} />}
          {!compact && dayTasks.length > 0 && <div className="mt-2 space-y-1">
            {dayTasks.slice(0, 2).map((task) => <div key={task.id} className={`truncate rounded-md px-1.5 py-1 text-[9px] font-semibold ${task.status === 'completed' ? 'bg-[#e0f1e4] text-[#307250] line-through opacity-70' : 'bg-white text-[#637269] shadow-[0_1px_2px_rgba(30,50,40,.04)]'}`}>{task.title}</div>)}
            {dayTasks.length > 2 && <p className="px-1 text-[9px] text-[#93a098]">+{dayTasks.length - 2} 项</p>}
          </div>}
        </button>
      })}
    </div>
    <div className="mt-4 flex flex-wrap gap-4 text-[10px] font-medium text-[#75837b]">
      <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#47a16b]" />全部完成</span>
      <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#e5b43f]" />部分完成</span>
      <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#bdc6bf]" />未开始</span>
    </div>
  </div>
}
