import { BarChart3, CalendarDays, Cloud, CloudOff, Compass, LayoutDashboard, Moon, Settings2, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useQuestStore } from '../hooks/useQuestStore'
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
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('toefl-quest:theme', dark ? 'dark' : 'light')
  }, [dark])
  const syncLabel = user ? (syncStatus === 'synced' ? '云端已同步' : syncStatus === 'syncing' ? '正在同步' : '同步异常') : '本机保存'

  return <div className="min-h-screen bg-[#f5f7f4] text-[#20332b] lg:grid lg:grid-cols-[238px_1fr]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[238px] flex-col border-r border-[#e3eae5] bg-[#fbfcfb] p-5 lg:flex">
      <div className="flex items-center gap-3 px-2 py-3">
        <div className="grid size-10 place-items-center rounded-2xl bg-[#287553] text-lg font-black text-white shadow-[0_10px_25px_rgba(40,117,83,.25)]">Q</div>
        <div><div className="font-extrabold tracking-tight">TOEFL Quest</div><div className="text-[11px] text-[#7b8981]">Small steps, real progress.</div></div>
      </div>
      <nav className="mt-7 space-y-1.5" aria-label="主要导航">
        {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `focus-ring flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${isActive ? 'bg-[#e7f3e9] text-[#236445]' : 'text-[#697970] hover:bg-[#f0f4f1] hover:text-[#334b3f]'}`}><Icon size={18} strokeWidth={2} />{label}</NavLink>)}
      </nav>
      <div className="mt-auto rounded-2xl border border-[#dfe9e2] bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#617269]">{user ? <Cloud size={15} className="text-[#2d7a56]" /> : <CloudOff size={15} />} {syncLabel}</div>
        <p className="mt-2 text-[11px] leading-5 text-[#8a968f]">未配置 Supabase 时，数据仍会保存在当前浏览器。</p>
      </div>
    </aside>

    <div className="min-w-0 lg:col-start-2">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#e5ebe7] bg-[#f5f7f4]/90 px-5 backdrop-blur-xl sm:px-8">
        <div><p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#89968f]">Your daily route</p><h1 className="text-xl font-extrabold tracking-tight">{titles[pathname] ?? 'TOEFL Quest'}</h1></div>
        <div className="flex items-center gap-2"><span className={`hidden rounded-full px-3 py-1.5 text-[10px] font-bold sm:inline ${dataMode === 'demo' ? 'bg-[#fff1c8] text-[#80641d]' : 'bg-[#e9f4ec] text-[#2e7250]'}`}>{dataMode === 'demo' ? '演示数据' : '真实数据'}</span><div className="hidden rounded-full border border-[#dce6df] bg-white px-3 py-1.5 text-xs font-semibold text-[#5f7167] sm:block">新版 TOEFL · 1–6 分制</div><button onClick={() => setDark((value) => !value)} className="focus-ring grid size-9 place-items-center rounded-xl border border-[#dce6df] bg-white text-[#5f7167]" aria-label={dark ? '切换浅色模式' : '切换深色模式'}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button></div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 pb-32 pt-6 sm:px-8 sm:pt-8">{children}</main>
    </div>

    <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border border-[#dce6df] bg-white/95 px-2 py-2 shadow-xl backdrop-blur lg:hidden" aria-label="移动端导航">
      {navItems.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex min-w-[52px] flex-col items-center gap-1 rounded-xl px-1 py-2 text-[9px] font-semibold ${isActive ? 'bg-[#e8f4ea] text-[#236445]' : 'text-[#75837b]'}`}><Icon size={18} />{label}</NavLink>)}
    </nav>
    <TimerDock />
  </div>
}
