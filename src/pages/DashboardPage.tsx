import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, Flame, Sparkles, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarMonth } from '../components/CalendarMonth'
import { TaskList } from '../components/TaskList'
import { Button, Card } from '../components/ui'
import { useQuestStore } from '../hooks/useQuestStore'
import { addDays, dateKeyInTimeZone, daysUntil, formatDate, startOfWeek } from '../lib/date'
import { completionRate, streak, totalMinutes, weeklyStudyDays } from '../lib/stats'

function StatCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#7c8a82]">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-[#253b30]">{value}</p><p className="mt-1 text-[11px] text-[#93a098]">{detail}</p></div><div className={`rounded-xl p-2.5 ${tone}`}>{icon}</div></div></Card>
}

export function DashboardPage() {
  const store = useQuestStore()
  const today = dateKeyInTimeZone(new Date(), store.profile.timezone)
  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState(today.slice(0, 7))
  const todayTasks = store.tasks.filter((task) => task.scheduledDate === today)
  const todayDone = todayTasks.filter((task) => task.status === 'completed').length
  const monthTasks = store.tasks.filter((task) => task.scheduledDate.startsWith(today.slice(0, 7)))
  const weekStart = startOfWeek(today)
  const weekEnd = addDays(weekStart, 6)
  const weekRate = completionRate(store.tasks, weekStart, weekEnd)
  const studyMinutes = totalMinutes(store.sessions)
  const selectedEnergy = store.checkins.find((item) => item.date === today)?.energy
  const daysLeft = daysUntil(store.profile.examDate, today)
  const routeMessage = useMemo(() => {
    if (!todayTasks.length) return '今天还没有任务。先加一个 10 分钟的小目标，让行动比焦虑先发生。'
    if (todayDone === todayTasks.length) return '今日路线已完成。你不需要再证明什么，好好休息也是计划的一部分。'
    return `今天只需完成 ${todayTasks.length - todayDone} 个小站点。先开始最短的一项，动力会在行动之后出现。`
  }, [todayDone, todayTasks])

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[26px] bg-[#dff1e2] p-6 sm:p-8">
      <div className="absolute -right-10 -top-16 size-56 rounded-full bg-white/25" /><div className="absolute -bottom-24 right-36 size-48 rounded-full bg-[#b9dfc4]/35" />
      <div className="relative grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
        <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#3f7659]"><Sparkles size={14} />{formatDate(today, { month: 'long', day: 'numeric', weekday: 'long' })}</div><h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-[-.03em] text-[#173b2b] sm:text-[38px]">{store.profile.name ? `${store.profile.name}，` : ''}今天学一点，<br className="hidden sm:block" />就比昨天更靠近目标。</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#4f6c5c]">{routeMessage}</p><div className="mt-6 flex flex-wrap items-center gap-3"><a href="#today-tasks"><Button>继续今日路线<ArrowRight size={16} /></Button></a><Link to="/plan"><Button variant="secondary">调整学习计划</Button></Link></div></div>
        <div className="rounded-2xl border border-white/60 bg-white/60 p-5 backdrop-blur"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-[#62806e]">目标航线</p><p className="mt-1 text-2xl font-black text-[#1d4b35]">{store.profile.currentScore.toFixed(1)} <span className="text-sm font-semibold text-[#789184]">→</span> {store.profile.targetScore.toFixed(1)}</p></div><div className="grid size-11 place-items-center rounded-2xl bg-[#296e4d] text-white"><Target size={21} /></div></div><div className="mt-5 h-2 rounded-full bg-[#c9dfcf]"><div className="h-full rounded-full bg-[#34835b]" style={{ width: `${Math.min(100, (store.profile.currentScore / store.profile.targetScore) * 100)}%` }} /></div><div className="mt-4 flex items-center justify-between text-xs text-[#617b6c]"><span>考试倒计时</span><strong className="text-[#315e45]">{daysLeft} 天</strong></div></div>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Flame size={19} />} label="连续学习" value={`${streak(store.tasks, store.profile)} 天`} detail="保持你的节奏" tone="bg-[#fff1df] text-[#c2752c]" />
      <StatCard icon={<CalendarCheck2 size={19} />} label="本周学习" value={`${weeklyStudyDays(store.tasks, today)} / 7 天`} detail={`任务完成率 ${Math.round(weekRate * 100)}%`} tone="bg-[#e8f3ff] text-[#4d7da8]" />
      <StatCard icon={<CheckCircle2 size={19} />} label="本月完成率" value={`${Math.round(completionRate(monthTasks) * 100)}%`} detail={`${monthTasks.filter((task) => task.status === 'completed').length} / ${monthTasks.length || 0} 项任务`} tone="bg-[#e8f6ec] text-[#37845b]" />
      <StatCard icon={<Clock3 size={19} />} label="累计学习" value={`${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`} detail="仅统计已记录时长" tone="bg-[#f1ecfb] text-[#7565a5]" />
    </section>

    {!selectedEnergy && <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-[#294033]">今天的能量怎么样？</h3><p className="mt-1 text-xs leading-5 text-[#78867e]">只用于调整建议强度，不评价你的自律。</p></div><div className="flex gap-2">{([['low', '🌱', '有点累'], ['steady', '🌤️', '还不错'], ['high', '⚡', '状态好']] as const).map(([energy, emoji, label]) => <button key={energy} onClick={() => store.saveCheckin({ date: today, energy })} className="focus-ring rounded-xl border border-[#dfe8e2] bg-white px-3 py-2 text-xs font-semibold text-[#53675c] hover:border-[#9dc5aa] hover:bg-[#f1f8f3]">{emoji} {label}</button>)}</div></Card>}

    <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
      <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-extrabold">本月路线图</h2><p className="mt-1 text-xs text-[#7d8a83]">点击日期查看或安排当天任务</p></div><Link to="/calendar" className="text-xs font-bold text-[#327556] hover:underline">打开完整日历 →</Link></div><CalendarMonth compact month={month} selectedDate={selectedDate} today={today} tasks={store.tasks} onMonthChange={setMonth} onSelectDate={setSelectedDate} /></Card>
      <Card id="today-tasks" className="p-5 sm:p-6"><TaskList date={selectedDate} title={selectedDate === today ? '今日任务' : '当日任务'} showDate /></Card>
    </section>
  </div>
}
