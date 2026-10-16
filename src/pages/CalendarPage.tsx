import { CalendarRange, Filter } from 'lucide-react'
import { useState } from 'react'
import { CalendarMonth } from '../components/CalendarMonth'
import { TaskList } from '../components/TaskList'
import { Card } from '../components/ui'
import { useQuestStore } from '../hooks/useQuestStore'
import { dateKeyInTimeZone } from '../lib/date'
import { SKILL_META, type Skill } from '../types'

export function CalendarPage() {
  const store = useQuestStore()
  const today = dateKeyInTimeZone(new Date(), store.profile.timezone)
  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [skill, setSkill] = useState<Skill | 'all'>('all')
  const visibleTasks = skill === 'all' ? store.tasks : store.tasks.filter((task) => task.skill === skill)
  const selectedCount = visibleTasks.filter((task) => task.scheduledDate === selectedDate).length

  return <div className="space-y-5">
    <Card className="p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#438060]"><CalendarRange size={15} />Calendar route</div><h2 className="mt-2 text-2xl font-black tracking-tight">每一天，都有清晰的下一步</h2><p className="mt-2 text-sm text-[#75847b]">状态颜色只反映实际完成记录，不会因为打开页面而变绿。</p></div><div className="flex flex-wrap items-center gap-2"><span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-[#7b8981]"><Filter size={14} />筛选</span><button onClick={() => setSkill('all')} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold ${skill === 'all' ? 'bg-[#255f45] text-white' : 'bg-[#f0f3f1] text-[#697870]'}`}>全部</button>{(Object.keys(SKILL_META) as Skill[]).map((item) => <button key={item} onClick={() => setSkill(item)} className={`focus-ring rounded-full px-3 py-1.5 text-xs font-semibold ${skill === item ? 'bg-[#255f45] text-white' : 'bg-[#f0f3f1] text-[#697870]'}`}>{SKILL_META[item].label}</button>)}</div></div>
      <CalendarMonth month={month} selectedDate={selectedDate} today={today} tasks={visibleTasks} onMonthChange={setMonth} onSelectDate={setSelectedDate} />
    </Card>
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <Card className="p-5 sm:p-6"><TaskList date={selectedDate} title="当天路线" showDate /></Card>
      <Card className="p-5"><p className="text-xs font-semibold text-[#7b8981]">选中日期概览</p><p className="mt-2 text-3xl font-black text-[#244032]">{selectedCount}</p><p className="text-xs text-[#839087]">个{skill === 'all' ? '' : SKILL_META[skill].label}任务</p><div className="mt-5 space-y-3 border-t border-[#edf0ee] pt-5 text-xs text-[#6f7f76]"><p>完成：<strong className="float-right text-[#347657]">{visibleTasks.filter((task) => task.scheduledDate === selectedDate && task.status === 'completed').length}</strong></p><p>计划时长：<strong className="float-right text-[#334b3f]">{visibleTasks.filter((task) => task.scheduledDate === selectedDate).reduce((sum, task) => sum + task.durationMinutes, 0)} 分钟</strong></p></div></Card>
    </div>
  </div>
}
