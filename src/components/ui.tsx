import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { SKILL_META, type Skill } from '../types'

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-[#287553] text-white shadow-sm hover:bg-[#1f6546]',
    secondary: 'border border-[#d9e4dc] bg-white text-[#2f4b3d] hover:bg-[#f3f7f4]',
    ghost: 'text-[#52665c] hover:bg-[#edf3ef]',
    danger: 'bg-[#fff1ef] text-[#a34338] hover:bg-[#ffe5e1]',
  }
  return <button className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>
}

export function Card({ children, className = '', ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return <section className={`soft-card rounded-[22px] ${className}`} {...props}>{children}</section>
}

export function SkillBadge({ skill }: { skill: Skill }) {
  const meta = SKILL_META[skill]
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ color: meta.color, backgroundColor: `${meta.color}12` }}><span className="size-1.5 rounded-full" style={{ backgroundColor: meta.color }} />{meta.label}</span>
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg', closable = true }: { open: boolean; onClose: () => void; title: string; children: ReactNode; width?: string; closable?: boolean }) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#163025]/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`quest-pop max-h-[92vh] w-full overflow-y-auto rounded-[24px] bg-white shadow-2xl ${width}`}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8eee9] bg-white/95 px-6 py-5 backdrop-blur">
        <h2 className="text-lg font-bold text-[#1d3529]">{title}</h2>
        {closable && <button onClick={onClose} className="focus-ring rounded-lg p-2 text-[#64766c] hover:bg-[#f0f4f1]" aria-label="关闭"><X size={18} /></button>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
}

export function EmptyState({ icon, title, detail, action }: { icon: ReactNode; title: string; detail: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
    <div className="mb-4 rounded-2xl bg-[#edf6ef] p-3 text-[#347657]">{icon}</div>
    <h3 className="font-bold text-[#274035]">{title}</h3>
    <p className="mt-2 max-w-sm text-sm leading-6 text-[#728079]">{detail}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
}
