import { BarChart3, CalendarDays, Cloud, CloudOff, Compass, LayoutDashboard, Moon, Settings2, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useQuestStore } from '../hooks/useQuestStore'
import { applyFontScale, readFontScale } from '../lib/display'
import { TimerDock } from './TimerDock'

const navItems = [
  { to: '/', label: '今日', icon: LayoutDashboard },
  { to: '/calendar', label: '学习日历', icon: CalendarDays },
  { to: '/plan', label: '学习计划', icon: Compass },
  { to: '/analytics', label: '学习分析', icon: BarChart3 },
  { to: '/settings', label: '设置', icon: Settings2 },
]

const titles: Record<string, string> = { '/': '今日学习', '/calendar': '学习日历', '/plan': '学习计划', '/analytics': '学习分析', '/settings': '设置与同步' }

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { syncStatus, user, dataMode } = useQuestStore()
  const [dark, setDark] = useState(() => localStorage.getItem('toefl-quest:theme') === 'dark')
  const [fontScale] = useState(readFontScale)
  useEffect(() => applyFontScale(fontScale), [fontScale])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('toefl-quest:theme', dark ? 'dark' : 'light')
  }, [dark])
  const syncLabel = user ? (syncStatus === 'synced' ? '云端已同步' : syncStatus === 'syncing' ? '正在同步' : '同步异常') : '本地保存'

  return <div className="min-h-screen bg-transparent text-[#1f2d26] lg:grid lg:grid-cols-[252px_1fr]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-white/5 bg-[#153c2c] p-4 text-white lg:flex">
      <div className="flex items-center gap-3 px-3 py-4">
        <div className="grid size-10 place-items-center rounded-xl bg-[#d9f0d4] text-lg font-black text-[#173c2d]">Q</div>
        <div><div className="font-extrabold tracking-[-.02em]">TOEFL Quest</div><div className="text-[11px] text-white/45">Small steps, real progress.</div></div>
      </div>
      <nav className="mt-5 space-y-1" aria-label="主要导航">
        {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `focus-ring flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition duration-200 ${isActive ? 'bg-[#f5f8f3] text-[#173f2e] shadow-sm' : 'text-white/62 hover:bg-white/[.07] hover:text-white'}`}><Icon size={18} strokeWidth={2} />{label}</NavLink>)}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.055] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-white/75">{user ? <Cloud size={15} className="text-[#9ed5ab]" /> : <CloudOff size={15} />} {syncLabel}</div>
        <p className="mt-2 text-[11px] leading-5 text-white/38">未配置 Supabase 时，学习记录会保存在当前浏览器。</p>
      </div>
    </aside>

    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#dde3dc] bg-[#f3f5f1]/88 px-5 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="flex items-center gap-3"><span className="hidden size-1.5 rounded-full bg-[#4b9b6d] sm:block" /><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#819087]">Your daily route</p><h1 className="text-lg font-extrabold tracking-[-.02em]">{titles[pathname] ?? 'TOEFL Quest'}</h1></div></div>
        <div className="flex items-center gap-2"><span className={`hidden rounded-full px-3 py-1.5 text-[10px] font-bold sm:inline ${dataMode === 'demo' ? 'bg-[#fff0c9] text-[#765c18]' : 'bg-[#e2f0e4] text-[#286848]'}`}>{dataMode === 'demo' ? '演示数据' : '真实数据'}</span><div className="hidden rounded-full border border-[#d7ded8] bg-white/75 px-3 py-1.5 text-[11px] font-semibold text-[#607068] md:block">新版 TOEFL · 1–6 分制</div><button onClick={() => setDark((value) => !value)} className="focus-ring grid size-9 place-items-center rounded-full border border-[#d7ded8] bg-white/80 text-[#53655b] shadow-sm" aria-label={dark ? '切换浅色模式' : '切换深色模式'}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button></div>
      </header>
      <main className="mx-auto w-full max-w-[1380px] px-4 pb-32 pt-5 sm:px-8 sm:pt-7 lg:px-10">{children}</main>
    </div>

    <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-[18px] border border-[#d9e0da] bg-[#fffefd]/95 px-2 py-2 shadow-[0_14px_40px_rgba(31,48,39,.16)] backdrop-blur lg:hidden" aria-label="移动端导航">
      {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-semibold transition ${isActive ? 'bg-[#1f6044] text-white' : 'text-[#75837b]'}`}><Icon size={18} />{label}</NavLink>)}
    </nav>
    <TimerDock />
  </div>
}
