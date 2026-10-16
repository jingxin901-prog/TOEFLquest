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
  return <Card className="metric-card p-4 sm:p-5"><div className="relative z-[1] flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.08em] text-[#819087]">{label}</p><p className="mt-2 text-[26px] font-extrabold tracking-[-.04em] text-[#22362c]">{value}</p><p className="mt-1 text-[11px] leading-5 text-[#8a9790]">{detail}</p></div><div className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}>{icon}</div></div></Card>
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
    if (todayDone === todayTasks.length) return '今日路线已完成。休息也是计划的一部分，明天继续保持。'
    return `还剩 ${todayTasks.length - todayDone} 个小任务。先开始最短的一项，让状态在行动中出现。`
  }, [todayDone, todayTasks])

  const startMinimum = async () => {
    let task = todayTasks.filter((item) => item.status === 'todo').sort((a, b) => Number(b.isMinimumTask) - Number(a.isMinimumTask) || a.durationMinutes - b.durationMinutes)[0]
    if (!task) task = await store.saveTask({ title: '10 分钟保底：只做一个小练习', description: '不追求完美，只完成一个可验证的小步骤。', scheduledDate: today, skill: 'reading', durationMinutes: 10, status: 'todo', source: 'manual', isMinimumTask: true })
    timer.startTask(task)
  }

  const submitCheckin = async () => {
    if (!canCheckin) return
    await store.saveCheckin({ date: today, energy: selectedEnergy, habitQualified: true, verifiedMinutes: todayMinutes, method: todayMinutes >= 10 ? 'timer' : 'manual_confirmation' })
  }

  return <div className="space-y-5 sm:space-y-6">
    {store.dataMode === 'demo' && <div className="rounded-xl border border-[#ead9a8] bg-[#fff8e6] px-4 py-3 text-xs font-semibold text-[#755d20]">演示数据模式 · 当前内容与真实数据完全分开，不会同步到云端。</div>}

    <section className="quest-grid relative overflow-hidden rounded-[22px] bg-[#153c2c] p-6 text-white shadow-[0_18px_50px_rgba(22,59,44,.13)] sm:p-8 lg:p-9">
      <div className="absolute -right-16 -top-20 size-72 rounded-full bg-[#78b88a]/15 blur-2xl" />
      <div className="absolute -bottom-24 left-[38%] size-64 rounded-full bg-[#d9efc7]/10 blur-3xl" />
      <div className="relative grid gap-7 lg:grid-cols-[1.42fr_.58fr] lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#a8d4b1]"><Sparkles size={14} />{formatDate(today, { month: 'long', day: 'numeric', weekday: 'long' })}</div>
          <h2 className="mt-5 max-w-2xl text-[32px] font-extrabold leading-[1.15] tracking-[-.045em] sm:text-[42px]">{store.profile.name ? `${store.profile.name}，` : ''}今天完成一点，<br className="hidden sm:block" />就离目标更近一点。</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/62">{routeMessage}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#today-tasks"><Button className="!bg-[#d9efc7] !text-[#153c2c] !shadow-none hover:!bg-[#e5f5d9]">开始今日路线<ArrowRight size={16} /></Button></a>
            <Button variant="secondary" onClick={startMinimum} className="!border-white/15 !bg-white/10 !text-white !shadow-none hover:!bg-white/15"><Leaf size={16} />今天不想学</Button>
            <Link to="/plan"><Button variant="ghost" className="!text-white/70 hover:!bg-white/10 hover:!text-white">调整计划</Button></Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.07] p-5 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-white/45">申请目标</p><p className="mt-2 text-xl font-extrabold tracking-[-.02em]">{store.profile.targetScore ? `TOEFL ${store.profile.targetScore.toFixed(1)}` : '待确认学校要求'}</p><p className="mt-2 text-xs leading-5 text-white/48">{store.profile.selfReportedLevel}</p></div>
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d9efc7] text-[#153c2c]"><Target size={19} /></div>
          </div>
          <div className="mt-6 flex items-end justify-between border-t border-white/10 pt-4"><span className="text-xs text-white/48">{daysLeft === null ? '尚未设定考试日期' : '考试倒计时'}</span><strong className="text-sm text-[#d9efc7]">{daysLeft === null ? '先完成诊断' : `${daysLeft} 天`}</strong></div>
        </div>
      </div>
    </section>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard icon={<Flame size={18} />} label="习惯连续天数" value={`${streak(store.checkins, store.profile)} 天`} detail="只统计已验证打卡" tone="bg-[#fff0df] text-[#b66c2a]" />
      <StatCard icon={<CalendarCheck2 size={18} />} label="本周打卡" value={`${weeklyStudyDays(store.checkins, today)} / 7`} detail={`目标任务完成率 ${Math.round(weekRate * 100)}%`} tone="bg-[#e8f0fb] text-[#5279a0]" />
      <StatCard icon={<CheckCircle2 size={18} />} label="本月完成率" value={`${Math.round(completionRate(monthTasks) * 100)}%`} detail={`${monthTasks.filter((task) => task.status === 'completed').length} / ${monthTasks.length || 0} 项任务`} tone="bg-[#e3f2e6] text-[#337d55]" />
      <StatCard icon={<Clock3 size={18} />} label="累计学习" value={`${Math.floor(studyMinutes / 60)}h ${studyMinutes % 60}m`} detail="仅统计已记录时长" tone="bg-[#efeafb] text-[#7262a0]" />
    </section>

    <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#edf5ee] text-[#397958]"><Leaf size={17} /></div><div><h3 className="font-bold text-[#294033]">{todayCheckin?.habitQualified ? '今天已完成习惯打卡' : selectedEnergy ? '学习状态已记录，可以开始了' : '今天的能量怎么样？'}</h3><p className="mt-1 text-xs leading-5 text-[#78867e]">能量记录不等于完成任务；当前已记录 {todayMinutes} 分钟。</p></div></div>
      <div className="flex flex-wrap gap-2">{!selectedEnergy && ([['low', '🌱', '有点累'], ['steady', '🌤️', '还不错'], ['high', '⚡', '状态好']] as const).map(([energy, emoji, label]) => <button key={energy} onClick={() => store.saveCheckin({ date: today, energy, habitQualified: false, verifiedMinutes: 0 })} className="focus-ring rounded-full border border-[#dce4de] bg-[#fbfcfa] px-3 py-2 text-xs font-semibold text-[#53675c] transition hover:border-[#9dc5aa] hover:bg-[#f1f8f3]">{emoji} {label}</button>)}{!todayCheckin?.habitQualified && <Button disabled={!canCheckin} onClick={submitCheckin}>提交今日打卡</Button>}</div>
    </Card>

    <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7c8b83]">Calendar</p><h2 className="mt-1 text-lg font-extrabold tracking-[-.02em]">本月路线图</h2><p className="mt-1 text-xs text-[#7d8a83]">点击日期查看或安排任务</p></div><Link to="/calendar" className="rounded-full bg-[#edf3ee] px-3 py-2 text-xs font-bold text-[#327556] transition hover:bg-[#e3ede5]">完整日历 →</Link></div><CalendarMonth compact month={month} selectedDate={selectedDate} today={today} tasks={store.tasks} onMonthChange={setMonth} onSelectDate={setSelectedDate} /></Card>
      <Card id="today-tasks" className="p-5 sm:p-6"><TaskList date={selectedDate} title={selectedDate === today ? '今日任务' : '当天任务'} showDate /></Card>
    </section>
  </div>
}
