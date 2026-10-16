import { Bell, Cloud, Download, ExternalLink, Laptop, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Button, Card } from '../components/ui'
import { useQuestStore } from '../hooks/useQuestStore'
import { SKILL_META, type Skill } from '../types'

export function SettingsPage() {
  const store = useQuestStore()
  const [profile, setProfile] = useState(store.profile)
  const [saved, setSaved] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [notificationState, setNotificationState] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported')

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    await store.saveProfile(profile)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }

  const requestNotifications = async () => {
    if (!('Notification' in window)) return
    const permission = await Notification.requestPermission()
    setNotificationState(permission)
  }

  const exportData = () => {
    const content = JSON.stringify({ profile: store.profile, tasks: store.tasks, sessions: store.sessions, scores: store.scores, checkins: store.checkins }, null, 2)
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `toefl-quest-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
    <div className="space-y-6">
      <Card className="p-6"><h2 className="text-lg font-extrabold">学习档案</h2><p className="mt-1 text-xs text-[#7b8981]">更改后可回到“学习计划”重新生成未来任务。</p><form onSubmit={save} className="mt-6 space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-[#42584c]">称呼<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label><label className="text-sm font-semibold text-[#42584c]">考试日期<input type="date" value={profile.examDate} onChange={(event) => setProfile({ ...profile, examDate: event.target.value })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label><label className="text-sm font-semibold text-[#42584c]">当前分数（1–6）<input type="number" min="1" max="6" step="0.5" value={profile.currentScore} onChange={(event) => setProfile({ ...profile, currentScore: Number(event.target.value) })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label><label className="text-sm font-semibold text-[#42584c]">目标分数（1–6）<input type="number" min="1" max="6" step="0.5" value={profile.targetScore} onChange={(event) => setProfile({ ...profile, targetScore: Number(event.target.value) })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label><label className="text-sm font-semibold text-[#42584c]">每日分钟<input type="number" min="10" max="180" value={profile.dailyMinutes} onChange={(event) => setProfile({ ...profile, dailyMinutes: Number(event.target.value) })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label><label className="text-sm font-semibold text-[#42584c]">优先弱项<select value={profile.weakSkill} onChange={(event) => setProfile({ ...profile, weakSkill: event.target.value as Skill })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] bg-white px-3 py-3 font-normal">{(Object.keys(SKILL_META) as Skill[]).filter((skill) => skill !== 'vocabulary').map((skill) => <option value={skill} key={skill}>{SKILL_META[skill].label}</option>)}</select></label><label className="text-sm font-semibold text-[#42584c] sm:col-span-2">时区<input value={profile.timezone} onChange={(event) => setProfile({ ...profile, timezone: event.target.value })} placeholder="Asia/Shanghai" className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label></div><div className="flex items-center justify-end gap-3"><span className={`text-xs font-semibold text-[#3c7d5b] transition ${saved ? 'opacity-100' : 'opacity-0'}`}>设置已保存</span><Button type="submit">保存学习档案</Button></div></form></Card>

      <Card className="p-6"><div className="flex items-start gap-3"><div className="rounded-xl bg-[#eef7f0] p-2.5 text-[#397b5a]"><Bell size={19} /></div><div><h2 className="font-extrabold">学习提醒</h2><p className="mt-1 text-xs leading-5 text-[#7b8981]">浏览器提醒仅在网站打开时可靠运行；未配置外部服务时不会假装已发送。</p></div></div><div className="mt-5 flex flex-col gap-4 rounded-2xl border border-[#e4eae6] p-4 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-[#485e52]">固定提醒时间<input type="time" value={profile.reminderTime} onChange={(event) => setProfile({ ...profile, reminderTime: event.target.value })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label><Button variant="secondary" onClick={requestNotifications} type="button">{notificationState === 'granted' ? '浏览器通知已允许' : notificationState === 'denied' ? '通知已被拒绝' : notificationState === 'unsupported' ? '浏览器不支持' : '启用浏览器通知'}</Button></div><div className="mt-4 rounded-2xl bg-[#faf7ef] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-[#6d5b31]">飞书 Webhook</p><p className="mt-1 text-xs text-[#8a7b58]">未配置 · 没有发送任何消息</p></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#9a7a32]">第三阶段接口预留</span></div></div></Card>
    </div>

    <div className="space-y-6">
      <Card className="p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#edf4fb] p-2.5 text-[#4f7da5]"><Cloud size={19} /></div><div><h2 className="font-extrabold">云端同步</h2><p className="mt-1 text-xs text-[#7d8a83]">{store.cloudEnabled ? store.user ? `已登录 ${store.user.email}` : 'Supabase 已配置，尚未登录' : '未配置 Supabase，当前为本机模式'}</p></div></div>{store.user ? <Button variant="secondary" className="mt-5 w-full" onClick={store.signOut}>退出云端账号</Button> : <div className="mt-5 space-y-3"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="邮箱" className="focus-ring w-full rounded-xl border border-[#dce5df] px-3 py-3 text-sm" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="密码（至少 6 位）" className="focus-ring w-full rounded-xl border border-[#dce5df] px-3 py-3 text-sm" /><div className="grid grid-cols-2 gap-2"><Button disabled={!store.cloudEnabled || !email || !password} onClick={async () => setAuthMessage((await store.signIn(email, password)) ?? '登录成功')}>登录</Button><Button variant="secondary" disabled={!store.cloudEnabled || !email || !password} onClick={async () => setAuthMessage((await store.signUp(email, password)) ?? '注册成功；请检查邮箱验证设置')}>注册</Button></div>{authMessage && <p className="rounded-xl bg-[#f2f5f3] p-3 text-xs leading-5 text-[#65766c]">{authMessage}</p>}</div>}<div className="mt-5 flex gap-2 rounded-xl bg-[#f2f6f3] p-3 text-[11px] leading-5 text-[#6e7d75]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#397b59]" />数据库启用 RLS 后，每个账号只能读取和修改自己的学习数据。</div></Card>

      <Card className="p-6"><div className="flex items-center gap-3"><div className="rounded-xl bg-[#f2eff8] p-2.5 text-[#7565a5]"><Laptop size={19} /></div><div><h2 className="font-extrabold">AI 学习教练</h2><p className="mt-1 text-xs text-[#7d8a83]">当前：本地规则模式</p></div></div><p className="mt-4 text-xs leading-6 text-[#708078]">AI 接口通过服务端代理预留，不在浏览器暴露密钥。未配置时，核心功能不受影响。</p><a href="https://www.ets.org/toefl/test-takers/ibt/about/content.html" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#3b7557] hover:underline">查看 ETS 新版考试结构 <ExternalLink size={12} /></a></Card>

      <Card className="p-6"><h2 className="font-extrabold">数据备份</h2><p className="mt-2 text-xs leading-6 text-[#7a8880]">导出当前浏览器中的学习记录为 JSON。不会上传到外部服务。</p><Button variant="secondary" className="mt-4 w-full" onClick={exportData}><Download size={16} />导出我的数据</Button></Card>
    </div>
  </div>
}
