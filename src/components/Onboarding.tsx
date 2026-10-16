import { ArrowRight, CalendarClock, Check, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useQuestStore } from '../hooks/useQuestStore'
import { dateKeyInTimeZone } from '../lib/date'
import { SKILL_META, type LearnerProfile, type Skill } from '../types'
import { Button, Modal } from './ui'

const topics = ['校园生活', '科技', '心理学', '商业', '环境', '历史', '艺术', '健康']
const scores = Array.from({ length: 11 }, (_, index) => 1 + index * 0.5)

export function Onboarding() {
  const store = useQuestStore()
  const [profile, setProfile] = useState<LearnerProfile>(store.profile)
  const [saving, setSaving] = useState(false)

  const toggleTopic = (topic: string) => setProfile((current) => ({ ...current, topics: current.topics.includes(topic) ? current.topics.filter((item) => item !== topic) : [...current.topics, topic] }))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    const next = { ...profile, onboardingComplete: true }
    await store.saveProfile(next)
    const today = dateKeyInTimeZone(new Date(), next.timezone)
    await store.createWeekPlan(today, 1, next)
    setSaving(false)
  }

  return <Modal open={!store.profile.onboardingComplete} onClose={() => undefined} closable={false} title="规划你的第一条学习路线" width="max-w-3xl">
    <div className="mb-6 rounded-2xl bg-[#edf7ef] p-5">
      <div className="flex items-start gap-3"><div className="rounded-xl bg-white p-2.5 text-[#2c7b56]"><Sparkles size={20} /></div><div><h3 className="font-bold text-[#254433]">先让计划适合你，而不是让你迁就计划</h3><p className="mt-1 text-sm leading-6 text-[#5f7468]">系统会先用本地规则生成 7 天任务；没有 AI Key 也能完整使用日历、计时和打卡。</p></div></div>
    </div>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-[#40554a]">怎么称呼你<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} placeholder="例如：Alex（可选）" className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3.5 py-3 font-normal" /></label>
        <label className="text-sm font-semibold text-[#40554a]">预计考试日期<input required type="date" value={profile.examDate} onChange={(event) => setProfile({ ...profile, examDate: event.target.value })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3.5 py-3 font-normal" /></label>
        <label className="text-sm font-semibold text-[#40554a]">当前水平（新版 1–6）<select value={profile.currentScore} onChange={(event) => setProfile({ ...profile, currentScore: Number(event.target.value) })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 py-3 font-normal">{scores.map((score) => <option key={score} value={score}>{score.toFixed(1)} · {score >= 5 ? 'C1+' : score >= 4 ? 'B2' : score >= 3 ? 'B1' : 'A1–A2'}</option>)}</select></label>
        <label className="text-sm font-semibold text-[#40554a]">目标成绩（新版 1–6）<select value={profile.targetScore} onChange={(event) => setProfile({ ...profile, targetScore: Number(event.target.value) })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 py-3 font-normal">{scores.filter((score) => score >= profile.currentScore).map((score) => <option key={score} value={score}>{score.toFixed(1)}</option>)}</select></label>
      </div>
      <fieldset><legend className="text-sm font-semibold text-[#40554a]">每天可用学习时间</legend><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{[10, 50, 90].map((minutes) => <button type="button" key={minutes} onClick={() => setProfile({ ...profile, dailyMinutes: minutes })} className={`focus-ring rounded-xl border px-3 py-3 text-sm font-semibold ${profile.dailyMinutes === minutes ? 'border-[#4a956e] bg-[#eaf6ed] text-[#246243]' : 'border-[#dfe7e1] bg-white text-[#64746b]'}`}>{minutes} 分钟<span className="mt-0.5 block text-[10px] font-normal opacity-70">{minutes === 10 ? '最低行动' : minutes === 50 ? '常规节奏' : '冲刺模式'}</span></button>)}<label className={`rounded-xl border px-3 py-2 ${![10, 50, 90].includes(profile.dailyMinutes) ? 'border-[#4a956e] bg-[#eaf6ed]' : 'border-[#dfe7e1]'}`}><span className="text-[10px] font-semibold text-[#718077]">自定义分钟</span><input type="number" min="10" max="180" value={profile.dailyMinutes} onChange={(event) => setProfile({ ...profile, dailyMinutes: Number(event.target.value) })} className="w-full bg-transparent text-sm font-bold outline-none" /></label></div></fieldset>
      <fieldset><legend className="text-sm font-semibold text-[#40554a]">目前最薄弱的能力</legend><div className="mt-2 flex flex-wrap gap-2">{(Object.keys(SKILL_META) as Skill[]).filter((skill) => skill !== 'vocabulary').map((skill) => <button type="button" key={skill} onClick={() => setProfile({ ...profile, weakSkill: skill })} className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold ${profile.weakSkill === skill ? 'border-[#4a956e] bg-[#eaf6ed] text-[#246243]' : 'border-[#dfe7e1] bg-white text-[#64746b]'}`}>{SKILL_META[skill].label}</button>)}</div></fieldset>
      <fieldset><legend className="text-sm font-semibold text-[#40554a]">感兴趣的话题 <span className="font-normal text-[#8b9790]">（可多选）</span></legend><div className="mt-2 flex flex-wrap gap-2">{topics.map((topic) => <button type="button" key={topic} onClick={() => toggleTopic(topic)} className={`focus-ring inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold ${profile.topics.includes(topic) ? 'border-[#9fcbb0] bg-[#eff8f1] text-[#2d704e]' : 'border-[#e0e6e2] text-[#6f7e76]'}`}>{profile.topics.includes(topic) && <Check size={12} />}{topic}</button>)}</div></fieldset>
      <div className="flex flex-col items-start justify-between gap-4 border-t border-[#e8eee9] pt-5 sm:flex-row sm:items-center"><p className="flex items-center gap-2 text-xs text-[#7a8880]"><CalendarClock size={15} />之后可在“学习计划”随时调整</p><Button type="submit" disabled={saving}>{saving ? '正在生成…' : '生成我的 7 天计划'}<ArrowRight size={16} /></Button></div>
    </form>
  </Modal>
}
