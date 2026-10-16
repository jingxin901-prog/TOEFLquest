import { ArrowRight, CalendarCheck2, CheckCircle2, Clock3, Flame, Leaf, Sparkles, Target } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarMonth } from '../components/CalendarMonth'
import { TaskList } from '../components/TaskList'
import { Button, Card } from '../components/ui'
import { useQuestStore } from '../hooks/useQuestStore'
import { useTimer } from '../hooks/useTimer'
import { addDays, dateKeyInTimeZone, daysUntil, formatDate, startOfWeek } from '../lib/date'
import { completionRate, streak, totalMinutes, weeklyStudyDays } from '../lib/stats'

function StatCard({ icon, label, value, detail, tone }: { icon: React.ReactNode; label: string; value: string; detail: string; tone: string }) {
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#7c8a82]">{label}</p><p className="mt-2 text-2xl font-black tracking-tight text-[#253b30]">{value}</p><p className="mt-1 text-[11px] text-[#93a098]">{detail}</p></div><div className={`rounded-xl p-2.5 ${tone}`}>{icon}</div></div></Card>
}

export function DashboardPage() {
  const store = useQuestStore()
  const timer = useTimer()
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
  const todayCheckin = store.checkins.find((item) => item.date === today)
  const selectedEnergy = todayCheckin?.energy
  const daysLeft = store.profile.examDate ? daysUntil(store.profile.examDate, today) : null
  const todayMinutes = store.sessions.filter((session) => dateKeyInTimeZone(new Date(session.startedAt), store.profile.timezone) === today).reduce((sum, session) => sum + session.durationMinutes, 0)
  const canCheckin = todayMinutes >= 10 || todayTasks.some((task) => task.status === 'completed')
  const routeMessage = useMemo(() => {
    if (!todayTasks.length) return '今天还没有任务。先加一个 10 分钟的小目标，让行动比焦虑先发生。'
    if (todayDone === todayTasks.length) return '今日路线已完成。你不需要再证明什么，好好休息也是计划的一部分。'
    return `今天只需完成 ${todayTasks.length - todayDone} 个小站点。先开始最短的一项，动力会在行动之后出现。`
  }, [todayDone, todayTasks])

  const startMinimum = async () => {
    let task = todayTasks.filter((item) => item.status === 'todo').sort((a, b) => Number(b.isMinimumTask) - Number(a.isMinimumTask) || a.durationMinutes - b.durationMinutes)[0]
    if (!task) task = await store.saveTask({ title: '10 分钟保底：只做一个小练习', description: '不追求完美，只完成一个可以验证的小步骤。', scheduledDate: today, skill: 'reading', durationMinutes: 10, status: 'todo', source: 'manual', isMinimumTask: true })
    timer.startTask(task)
  }

  const submitCheckin = async () => {
    if (!canCheckin) return
    await store.saveCheckin({ date: today, energy: selectedEnergy, habitQualified: true, verifiedMinutes: todayMinutes, method: todayMinutes >= 10 ? 'timer' : 'manual_confirmation' })
  }

  return <div className="space-y-6">
    {store.dataMode === 'demo' && <div className="rounded-2xl border border-[#eed690] bg-[#fff9e8] px-4 py-3 text-xs font-semibold text-[#806520]">演示数据模式 · 当前操作与真实数据完全分开，不会同步到云端。</div>}
    <section className="relative overflow-hidden rounded-[26px] bg-[#dff1e2] p-6 sm:p-8">
      <div className="absolute -right-10 -top-16 size-56 rounded-full bg-white/25" /><div className="absolute -bottom-24 right-36 size-48 rounded-full bg-[#b9dfc4]/35" />
      <div className="relative grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-center">
        <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#3f7659]"><Sparkles size={14} />{formatDate(today, { month: 'long', day: 'numeric', weekday: 'long' })}</div><h2 className="mt-4 max-w-2xl text-3xl font-black leading-tight tracking-[-.03em] text-[#173b2b] sm:text-[38px]">{store.profile.name ? `${store.profile.name}，` : ''}今天学一点，<br className="hidden sm:block" />就比昨天更靠近目标。</h2><p className="mt-4 max-w-xl text-sm leading-7 text-[#4f6c5c]">{routeMessage}</p><div className="mt-6 flex flex-wrap items-center gap-3"><a href="#today-tasks"><Button>继续今日路线<ArrowRight size={16} /></Button></a><Button variant="secondary" onClick={startMinimum}><Leaf size={16} />今天不想学</Button><Link to="/plan"><Button variant="ghost">调整计划</Button></Link></div></div>
        <div className="rounded-2xl border border-white/60 bg-white/60 p-5 backdrop-blur"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold text-[#62806e]">申请目标</p><p className="mt-1 text-lg font-black text-[#1d4b35]">{store.profile.targetScore ? `TOEFL ${store.profile.targetScore.toFixed(1)}` : '待确认学校要求'}</p><p className="mt-1 text-[11px] text-[#6d8377]">{store.profile.selfReportedLevel}</p></div><div className="grid size-11 place-items-center rounded-2xl bg-[#296e4d] text-white"><Target size={21} /></div></div><div className="mt-5 h-2 rounded-full bg-[#c9dfcf]"><div className="h-full w-[12%] rounded-full bg-[#34835b]" /></div><div className="mt-4 flex items-center justify-between text-xs text-[#617b6c]"><span>{daysLeft === null ? '尚未设定考试日期' : '考试倒计时'}</span><strong className="text-[#315e45]">{daysLeft === null ? '先完成诊断' : `${daysLeft} 天`}</strong></div></div>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard icon={<Flame size={19} />} label="习惯连续天数" value={`${streak(store.checkins, store.profile)} 天`} detail="只统计已验证打卡" tone="bg-[#fff1df] text-[#c2752c]" />
      <StatCard icon={<CalendarCheck2 size={19} />} label="本周打卡" value={`${weeklyStudyDays(store.checkins, today)} / 7 天`} detail={`目标任务完成率 ${Math.round(weekRate * 100)}%`} tone="bg-[#e8f3ff] text-[#4d7da8]" />
      <StatCard icon={<CheckCircle2 size={19} />} label="本月完成率" value={`${Math.round(completionRate(monthTasks) * 100)}%`} detail={`${monthTasks.filter((task) => task.status === 'completed').length} / ${monthTasks.length || 0} 项任务`} tone="bg-[#e8f6ec] text-[#37845b]" />
      <StatCard icon={<Clock3 size={19} />} label="累计学习" value={`${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`} detail="仅统计已记录时长" tone="bg-[#f1ecfb] text-[#7565a5]" />
    </section>

    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-bold text-[#294033]">{todayCheckin?.habitQualified ? '今天已完成习惯打卡' : selectedEnergy ? '学习后别忘了提交打卡' : '今天的能量怎么样？'}</h3><p className="mt-1 text-xs leading-5 text-[#78867e]">能量记录不等于打卡；需有计时记录或明确完成确认。当前已记录 {todayMinutes} 分钟。</p></div><div className="flex flex-wrap gap-2">{!selectedEnergy && ([['low', '🌱', '有点累'], ['steady', '🌤️', '还不错'], ['high', '⚡', '状态好']] as const).map(([energy, emoji, label]) => <button key={energy} onClick={() => store.saveCheckin({ date: today, energy, habitQualified: false, verifiedMinutes: 0 })} className="focus-ring rounded-xl border border-[#dfe8e2] bg-white px-3 py-2 text-xs font-semibold text-[#53675c] hover:border-[#9dc5aa] hover:bg-[#f1f8f3]">{emoji} {label}</button>)}{!todayCheckin?.habitQualified && <Button disabled={!canCheckin} onClick={submitCheckin}>提交今日打卡</Button>}</div></Card>

    <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
      <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-extrabold">本月路线图</h2><p className="mt-1 text-xs text-[#7d8a83]">点击日期查看或安排当天任务</p></div><Link to="/calendar" className="text-xs font-bold text-[#327556] hover:underline">打开完整日历 →</Link></div><CalendarMonth compact month={month} selectedDate={selectedDate} today={today} tasks={store.tasks} onMonthChange={setMonth} onSelectDate={setSelectedDate} /></Card>
      <Card id="today-tasks" className="p-5 sm:p-6"><TaskList date={selectedDate} title={selectedDate === today ? '今日任务' : '当日任务'} showDate /></Card>
    </section>
  </div>
}
