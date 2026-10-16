import { BarChart3, Plus, Target, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, Modal } from '../components/ui'
import { useQuestStore } from '../hooks/useQuestStore'
import { addDays, dateKeyInTimeZone, startOfWeek } from '../lib/date'
import { completionRate, dailyMinutes, skillMinutes, totalMinutes } from '../lib/stats'
import { SKILL_META, type ScoreRecord, type Skill } from '../types'

const scoreLabels: Record<ScoreRecord['type'], string> = { official: '真实考试', mock: '模考', ai: 'AI 练习反馈' }

export function AnalyticsPage() {
  const store = useQuestStore()
  const today = dateKeyInTimeZone(new Date(), store.profile.timezone)
  const [addingScore, setAddingScore] = useState(false)
  const [scoreDraft, setScoreDraft] = useState<Omit<ScoreRecord, 'id'>>({ date: today, type: 'mock', overall: 4 })
  const trend = dailyMinutes(store.sessions, today)
  const maxDaily = Math.max(30, ...trend.map((item) => item.minutes))
  const bySkill = skillMinutes(store.sessions)
  const maxSkill = Math.max(1, ...Object.values(bySkill))
  const weekStart = startOfWeek(today)
  const rate = completionRate(store.tasks, weekStart, addDays(weekStart, 6))
  const weakest = (Object.entries(bySkill).filter(([skill]) => skill !== 'vocabulary').sort((a, b) => a[1] - b[1])[0]?.[0] ?? store.profile.weakSkill) as Skill
  const scoreGap = Math.max(0, store.profile.targetScore - (store.scores.filter((score) => score.type !== 'ai').at(-1)?.overall ?? store.profile.currentScore))

  const submitScore = async (event: React.FormEvent) => {
    event.preventDefault()
    await store.saveScore(scoreDraft)
    setAddingScore(false)
  }

  return <div className="space-y-6">
    <section className="grid gap-4 md:grid-cols-3"><Card className="p-5"><p className="text-xs font-semibold text-[#7b8981]">本周任务完成率</p><p className="mt-2 text-3xl font-black">{Math.round(rate * 100)}%</p><div className="mt-4 h-2 rounded-full bg-[#edf1ee]"><div className="h-full rounded-full bg-[#48966a]" style={{ width: `${rate * 100}%` }} /></div></Card><Card className="p-5"><p className="text-xs font-semibold text-[#7b8981]">累计有效学习</p><p className="mt-2 text-3xl font-black">{totalMinutes(store.sessions)} <span className="text-sm font-semibold text-[#7e8c84]">分钟</span></p><p className="mt-3 text-xs text-[#8a968f]">来自计时器结束后的记录</p></Card><Card className="p-5"><p className="text-xs font-semibold text-[#7b8981]">与目标差距</p><p className="mt-2 text-3xl font-black">{scoreGap.toFixed(1)} <span className="text-sm font-semibold text-[#7e8c84]">分</span></p><p className="mt-3 text-xs text-[#8a968f]">仅依据真实考试或模考</p></Card></section>

    <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="p-6"><div className="flex items-center justify-between"><div><h2 className="font-extrabold">每日学习时长</h2><p className="mt-1 text-xs text-[#7e8b84]">最近 14 天</p></div><BarChart3 className="text-[#4d8a68]" size={20} /></div><div className="mt-7 flex h-52 items-end gap-1.5 sm:gap-3">{trend.map((item, index) => <div key={item.date} className="group flex h-full flex-1 flex-col items-center justify-end"><div className="relative w-full rounded-t-lg bg-[#74b38d] transition hover:bg-[#3f8a62]" style={{ height: `${Math.max(item.minutes ? 8 : 2, (item.minutes / maxDaily) * 100)}%` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 text-[10px] font-bold text-[#3e5b4c] group-hover:block">{item.minutes}m</span></div>{(index % 2 === 0 || window.innerWidth > 640) && <span className="mt-2 text-[9px] text-[#8d9992]">{Number(item.date.slice(-2))}</span>}</div>)}</div></Card>
      <Card className="p-6"><h2 className="font-extrabold">四项投入分布</h2><p className="mt-1 text-xs text-[#7e8b84]">按已记录学习时长</p><div className="mt-6 space-y-5">{(Object.keys(SKILL_META) as Skill[]).filter((skill) => skill !== 'vocabulary').map((skill) => <div key={skill}><div className="mb-2 flex justify-between text-xs"><span className="font-semibold text-[#52675b]">{SKILL_META[skill].label}</span><span className="text-[#859189]">{bySkill[skill]} 分钟</span></div><div className="h-2 rounded-full bg-[#edf1ee]"><div className="h-full rounded-full" style={{ width: `${(bySkill[skill] / maxSkill) * 100}%`, backgroundColor: SKILL_META[skill].color }} /></div></div>)}</div></Card>
    </section>

    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <Card className="p-6"><div className="flex items-center justify-between"><div><h2 className="font-extrabold">成绩记录</h2><p className="mt-1 text-xs text-[#7e8b84]">真实考试、模考与 AI 反馈严格区分</p></div><Button onClick={() => setAddingScore(true)}><Plus size={15} />添加记录</Button></div>{store.scores.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="text-[10px] uppercase tracking-wider text-[#8b9690]"><tr className="border-b border-[#e7ece8]"><th className="py-3">日期</th><th>类型</th><th>总分</th><th>阅读</th><th>听力</th><th>口语</th><th>写作</th></tr></thead><tbody>{[...store.scores].sort((a, b) => b.date.localeCompare(a.date)).map((score) => <tr key={score.id} className="border-b border-[#eef1ef] text-[#53665b]"><td className="py-4">{score.date}</td><td><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${score.type === 'official' ? 'bg-[#e8f5ec] text-[#347657]' : score.type === 'mock' ? 'bg-[#edf3fb] text-[#4f78a0]' : 'bg-[#f4effb] text-[#7565a5]'}`}>{scoreLabels[score.type]}</span></td><td className="font-black text-[#2a4336]">{score.overall.toFixed(1)}</td><td>{score.reading?.toFixed(1) ?? '—'}</td><td>{score.listening?.toFixed(1) ?? '—'}</td><td>{score.speaking?.toFixed(1) ?? '—'}</td><td>{score.writing?.toFixed(1) ?? '—'}</td></tr>)}</tbody></table></div> : <div className="mt-6 rounded-2xl border border-dashed border-[#dbe4de] py-12 text-center text-sm text-[#87928c]">还没有成绩记录。添加一次模考，趋势就会从这里开始。</div>}</Card>
      <Card className="bg-[#1e4935] p-6 text-white"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#a9d3b7]"><TrendingUp size={15} />Weekly coach</div><h2 className="mt-4 text-xl font-black">本周复盘</h2><p className="mt-3 text-sm leading-7 text-white/75">{rate >= .8 ? '执行很稳定。下周可以保留当前负担，并增加一次限时整套练习。' : rate >= .5 ? '节奏正在形成。下周继续维持总时长，把最难任务拆成两个更短的开始。' : '先把目标缩小。连续完成 10 分钟，比安排 90 分钟却迟迟不开始更有效。'}</p><div className="mt-6 rounded-2xl bg-white/10 p-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-white/55">建议关注</p><p className="mt-2 font-bold">{SKILL_META[weakest].label}</p><p className="mt-1 text-xs leading-5 text-white/65">这是当前记录中投入较少的一项，不等同于官方能力诊断。</p></div></Card>
    </section>

    <Modal open={addingScore} onClose={() => setAddingScore(false)} title="添加成绩记录">
      <form onSubmit={submitScore} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#40554a]">日期<input type="date" required value={scoreDraft.date} onChange={(event) => setScoreDraft({ ...scoreDraft, date: event.target.value })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label><label className="text-sm font-semibold text-[#40554a]">记录类型<select value={scoreDraft.type} onChange={(event) => setScoreDraft({ ...scoreDraft, type: event.target.value as ScoreRecord['type'] })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] bg-white px-3 py-3 font-normal"><option value="official">真实考试</option><option value="mock">模考</option><option value="ai">AI 练习反馈</option></select></label></div><div className="rounded-xl bg-[#fff8e7] p-3 text-xs leading-5 text-[#836a2f]">AI 反馈只能作为练习参考，不会被计入官方 TOEFL 成绩或目标差距。</div><label className="text-sm font-semibold text-[#40554a]">总分（1–6）<input type="number" min="1" max="6" step="0.5" required value={scoreDraft.overall} onChange={(event) => setScoreDraft({ ...scoreDraft, overall: Number(event.target.value) })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label><div className="grid grid-cols-2 gap-3">{(['reading', 'listening', 'speaking', 'writing'] as const).map((skill) => <label key={skill} className="text-xs font-semibold text-[#566a5f]">{SKILL_META[skill].label}<input type="number" min="1" max="6" step="0.5" value={scoreDraft[skill] ?? ''} onChange={(event) => setScoreDraft({ ...scoreDraft, [skill]: event.target.value ? Number(event.target.value) : undefined })} className="focus-ring mt-1.5 w-full rounded-xl border border-[#dce5df] px-3 py-2.5 font-normal" /></label>)}</div><div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setAddingScore(false)}>取消</Button><Button type="submit">保存记录</Button></div></form>
    </Modal>
  </div>
}
