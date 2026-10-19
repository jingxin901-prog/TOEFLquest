import { AlertCircle, CalendarPlus2, RefreshCw, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card } from '../components/ui'
import { useQuestStore } from '../hooks/useQuestStore'
import { addDays, dateKeyInTimeZone, startOfWeek } from '../lib/date'
import { updatedToeflModules } from '../lib/planner'
import { completionRate } from '../lib/stats'
import { SKILL_META, type Skill } from '../types'

export function PlanPage() {
  const store = useQuestStore()
  const today = dateKeyInTimeZone(new Date(), store.profile.timezone)
  const [minutes, setMinutes] = useState(store.profile.dailyMinutes)
  const [prioritySkill, setPrioritySkill] = useState<Skill | null>(store.profile.prioritySkill)
  const [message, setMessage] = useState('')
  const weekStart = startOfWeek(today)
  const weekRate = completionRate(store.tasks, weekStart, addDays(weekStart, 6))
  const nextSeven = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(today, index)), [today])

  const rebuild = async () => {
    const nextProfile = { ...store.profile, dailyMinutes: minutes, prioritySkill }
    await store.saveProfile(nextProfile)
    await store.createWeekPlan(today, weekRate || 1, nextProfile)
    setMessage('接下来 7 天的计划已更新。已完成任务不会被覆盖。')
  }

  const replan = async () => {
    const count = await store.replanIncomplete(today)
    setMessage(count ? `已把 ${count} 项未完成任务温和补排到未来两天。` : '目前没有需要补排的任务。')
  }

  return <div className="plan-page space-y-6">
    <section className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <Card className="p-6"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#3b7a58]"><Sparkles size={15} />Local rule coach</div><h2 className="mt-3 text-2xl font-black tracking-tight">计划要有弹性，才更容易坚持</h2><p className="mt-2 text-sm leading-7 text-[#6d7d74]">当前使用明确标记的本地规则模式。诊断前四项均衡覆盖；选择优先项后才会提高对应训练比重。</p><div className="mt-6 rounded-2xl border border-[#e4ebe6] bg-[#f9fbf9] p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-[#5a6f63]">本周完成率</span><strong className="text-[#2f7954]">{Math.round(weekRate * 100)}%</strong></div><div className="mt-3 h-2 rounded-full bg-[#e5ebe7]"><div className="h-full rounded-full bg-[#4a9a6c]" style={{ width: `${weekRate * 100}%` }} /></div><p className="mt-3 text-xs leading-5 text-[#849088]">低于 55% 时，下周单日负担会自动调整为原计划约 75%；每天仍保留独立的 10 分钟保底任务。</p></div></Card>
      <Card className="p-6"><h3 className="font-extrabold">调整每日路线</h3><div className="mt-5"><p className="text-xs font-semibold text-[#687970]">可用时间</p><div className="mt-2 grid grid-cols-4 gap-2">{[10, 50, 90].map((value) => <button key={value} onClick={() => setMinutes(value)} className={`focus-ring rounded-xl border px-2 py-3 text-sm font-bold ${minutes === value ? 'border-[#4a956e] bg-[#eaf6ed] text-[#246243]' : 'border-[#e0e7e2] text-[#6a7a71]'}`}>{value}<span className="block text-[9px] font-medium">分钟</span></button>)}<label className={`rounded-xl border px-2 py-2 ${![10, 50, 90].includes(minutes) ? 'border-[#4a956e] bg-[#eaf6ed]' : 'border-[#e0e7e2]'}`}><span className="text-[9px] font-semibold text-[#7b8981]">自定义</span><input aria-label="自定义分钟" type="number" min="10" max="180" value={minutes} onChange={(event) => setMinutes(Number(event.target.value))} className="w-full bg-transparent text-center text-sm font-bold outline-none" /></label></div></div><div className="mt-5"><p className="text-xs font-semibold text-[#687970]">训练优先项（可空）</p><div className="mt-2 flex flex-wrap gap-2"><button onClick={() => setPrioritySkill(null)} className={`focus-ring rounded-full px-3 py-2 text-xs font-semibold ${prioritySkill === null ? 'bg-[#275f45] text-white' : 'bg-[#f0f3f1] text-[#66766d]'}`}>四项均衡</button>{(Object.keys(SKILL_META) as Skill[]).filter((item) => item !== 'vocabulary').map((item) => <button key={item} onClick={() => setPrioritySkill(item)} className={`focus-ring rounded-full px-3 py-2 text-xs font-semibold ${prioritySkill === item ? 'bg-[#275f45] text-white' : 'bg-[#f0f3f1] text-[#66766d]'}`}>{SKILL_META[item].label}</button>)}</div></div><div className="mt-6 flex flex-wrap gap-3"><Button onClick={rebuild}><CalendarPlus2 size={16} />生成 7 天计划</Button><Button variant="secondary" onClick={replan}><RefreshCw size={16} />补排未完成</Button></div>{message && <p className="mt-4 rounded-xl bg-[#eef7f0] px-4 py-3 text-xs font-semibold text-[#377053]">{message}</p>}</Card>
    </section>

    <Card className="p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h3 className="text-lg font-extrabold">未来 7 天</h3><p className="mt-1 text-xs text-[#7e8c84]">任务可在日历中继续增删改查</p></div><p className="text-xs text-[#738178]">目标 {minutes} 分钟 / 天 · {prioritySkill ? `优先 ${SKILL_META[prioritySkill].label}` : '四项均衡'}</p></div><div className="mt-5 grid gap-3 md:grid-cols-7">{nextSeven.map((date, index) => { const tasks = store.tasks.filter((task) => task.scheduledDate === date); const done = tasks.filter((task) => task.status === 'completed').length; return <div key={date} className={`rounded-2xl border p-3 ${index === 0 ? 'border-[#a8cdb5] bg-[#f0f8f2]' : 'border-[#e4eae6] bg-white'}`}><p className="text-[10px] font-semibold text-[#829088]">{index === 0 ? '今天' : ['一', '二', '三', '四', '五', '六', '日'][new Date(`${date}T12:00:00Z`).getUTCDay() === 0 ? 6 : new Date(`${date}T12:00:00Z`).getUTCDay() - 1]}</p><p className="mt-1 text-lg font-black text-[#2c4638]">{Number(date.slice(-2))}</p><div className="mt-3 space-y-1.5">{tasks.length ? tasks.slice(0, 4).map((task) => <div key={task.id} title={task.title} className="truncate rounded-lg bg-[#f1f4f2] px-2 py-1.5 text-[10px] font-medium text-[#66766d]">{task.isMinimumTask ? '保底 · ' : ''}{SKILL_META[task.skill].short} · {task.durationMinutes}m</div>) : <p className="py-4 text-center text-[10px] text-[#a2aaa5]">未安排</p>}</div>{tasks.length > 0 && <p className="mt-3 text-[10px] text-[#718078]">{done}/{tasks.length} 完成</p>}</div>})}</div></Card>

    <Card className="p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-[#edf5ff] p-2.5 text-[#4d7da8]"><AlertCircle size={19} /></div><div><h3 className="font-extrabold">2026-01-21 起的新版 TOEFL iBT 结构</h3><p className="mt-1 text-xs leading-5 text-[#7b8981]">计划按新版任务类型设计，分项与总分使用 1–6、0.5 分增量；不是把旧版题型作为唯一依据。</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{updatedToeflModules.map((module) => <div key={module.skill} className="rounded-2xl border border-[#e4eae6] bg-[#fbfcfb] p-4"><p className="text-xs font-bold text-[#387656]">{module.skill}</p><p className="mt-2 text-sm font-semibold leading-6 text-[#334a3e]">{module.detail}</p><p className="mt-3 text-[10px] text-[#8a968f]">{module.count}</p></div>)}</div><p className="mt-4 text-[11px] text-[#8b9690]">题型与基准时长依据 ETS 官方更新；自适应测试下实际项目数和用时可能变化。</p></Card>
  </div>
}
