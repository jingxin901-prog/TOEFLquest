import { Check, Clock3, MoreHorizontal, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useQuestStore } from '../hooks/useQuestStore'
import { useTimer } from '../hooks/useTimer'
import { formatDate } from '../lib/date'
import { SKILL_META, type Skill, type StudyTask } from '../types'
import { Button, EmptyState, Modal, SkillBadge } from './ui'

const emptyDraft = (date: string) => ({ title: '', description: '', scheduledDate: date, skill: 'reading' as Skill, durationMinutes: 20 })

export function TaskList({ date, title, showDate = false }: { date: string; title?: string; showDate?: boolean }) {
  const store = useQuestStore()
  const timer = useTimer()
  const tasks = store.tasks.filter((task) => task.scheduledDate === date).sort((a, b) => Number(a.status === 'completed') - Number(b.status === 'completed'))
  const [editing, setEditing] = useState<StudyTask | null | 'new'>(null)
  const [draft, setDraft] = useState(emptyDraft(date))
  const [confirming, setConfirming] = useState<StudyTask | null>(null)
  const [menuTask, setMenuTask] = useState<string | null>(null)

  const openEditor = (task?: StudyTask) => {
    if (task) {
      setDraft({ title: task.title, description: task.description, scheduledDate: task.scheduledDate, skill: task.skill, durationMinutes: task.durationMinutes })
      setEditing(task)
    } else {
      setDraft(emptyDraft(date))
      setEditing('new')
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft.title.trim()) return
    await store.saveTask({
      ...(editing !== 'new' && editing ? editing : {}),
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: editing !== 'new' && editing ? editing.status : 'todo',
      source: editing !== 'new' && editing ? editing.source : 'manual',
    })
    setEditing(null)
  }

  const tryComplete = async (task: StudyTask) => {
    if (task.status === 'completed') {
      await store.setTaskStatus(task.id, 'todo')
      return
    }
    const recorded = store.sessions.filter((session) => session.taskId === task.id).reduce((sum, item) => sum + item.durationMinutes, 0)
    if (recorded >= Math.max(5, Math.round(task.durationMinutes * 0.5))) await store.setTaskStatus(task.id, 'completed', 'timer')
    else setConfirming(task)
  }

  return <div>
    <div className="mb-4 flex items-center justify-between gap-3">
      <div>{title && <h2 className="font-extrabold text-[#20392c]">{title}</h2>}{showDate && <p className="mt-1 text-xs text-[#829088]">{formatDate(date)}</p>}</div>
      <Button onClick={() => openEditor()} className="!px-3 !py-2"><Plus size={16} />添加任务</Button>
    </div>
    {tasks.length === 0 ? <EmptyState icon={<Clock3 size={22} />} title="这一天还没有任务" detail="从一个能在 10 分钟内完成的小任务开始，也算向目标前进。" action={<Button onClick={() => openEditor()}>添加第一个任务</Button>} /> : <div className="space-y-3">
      {tasks.map((task) => {
        const done = task.status === 'completed'
        return <article key={task.id} className={`group relative rounded-2xl border p-4 transition ${done ? 'border-[#dce9df] bg-[#f7faf7]' : 'border-[#e4eae6] bg-white hover:border-[#c3d8ca] hover:shadow-sm'}`}>
          <div className="flex items-start gap-3">
            <button onClick={() => tryComplete(task)} className={`focus-ring mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border transition ${done ? 'border-[#37845b] bg-[#37845b] text-white' : 'border-[#c7d1ca] bg-white text-transparent hover:border-[#4d936d]'}`} aria-label={done ? '标为未完成' : '确认完成'}><Check size={15} strokeWidth={3} /></button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><SkillBadge skill={task.skill} />{task.isMinimumTask && <span className="rounded-full bg-[#eaf6ed] px-2 py-1 text-[10px] font-semibold text-[#2d754f]">今日保底</span>}{task.source === 'rescheduled' && <span className="rounded-full bg-[#fff6dd] px-2 py-1 text-[10px] font-semibold text-[#9b7415]">已补排</span>}</div>
              <h3 className={`mt-2 font-bold leading-6 ${done ? 'text-[#718079] line-through' : 'text-[#253c31]'}`}>{task.title}</h3>
              {task.description && <p className="mt-1 text-sm leading-6 text-[#75837b]">{task.description}</p>}
              <div className="mt-3 flex items-center gap-3 text-xs font-medium text-[#849087]"><span className="flex items-center gap-1"><Clock3 size={13} />{task.durationMinutes} 分钟</span><span>· {SKILL_META[task.skill].label}</span></div>
            </div>
            {!done && <div className="hidden gap-2 sm:flex"><Button variant="secondary" onClick={() => timer.startTask(task, 'pomodoro')} className="!px-3 !py-2"><Clock3 size={14} />25′</Button><Button onClick={() => timer.startTask(task)} className="!px-3 !py-2"><Play size={14} fill="currentColor" />开始</Button></div>}
            <div className="relative">
              <button onClick={() => setMenuTask(menuTask === task.id ? null : task.id)} className="focus-ring rounded-lg p-2 text-[#8a968f] hover:bg-[#edf2ee]" aria-label="任务操作"><MoreHorizontal size={18} /></button>
              {menuTask === task.id && <div className="absolute right-0 top-10 z-10 w-32 rounded-xl border border-[#e1e8e3] bg-white p-1.5 shadow-lg">
                <button onClick={() => { openEditor(task); setMenuTask(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#4f6258] hover:bg-[#f0f4f1]"><Pencil size={13} />编辑</button>
                <button onClick={async () => { await store.removeTask(task.id); setMenuTask(null) }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#a44f45] hover:bg-[#fff1ef]"><Trash2 size={13} />删除</button>
              </div>}
            </div>
          </div>
          {!done && <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden"><Button variant="secondary" onClick={() => timer.startTask(task, 'pomodoro')}><Clock3 size={14} />番茄 25′</Button><Button onClick={() => timer.startTask(task)}><Play size={14} />自由计时</Button></div>}
        </article>
      })}
    </div>}

    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing === 'new' ? '添加学习任务' : '编辑学习任务'}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-semibold text-[#40554a]">任务名称<input autoFocus value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="例如：Academic Talk 精听" className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3.5 py-3 font-normal" /></label>
        <label className="block text-sm font-semibold text-[#40554a]">任务说明<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="写下完成标准，开始时更轻松" rows={3} className="focus-ring mt-2 w-full resize-none rounded-xl border border-[#dce5df] px-3.5 py-3 font-normal" /></label>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-semibold text-[#40554a] sm:col-span-1">日期<input type="date" value={draft.scheduledDate} onChange={(event) => setDraft({ ...draft, scheduledDate: event.target.value })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label>
          <label className="block text-sm font-semibold text-[#40554a]">能力<select value={draft.skill} onChange={(event) => setDraft({ ...draft, skill: event.target.value as Skill })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] bg-white px-3 py-3 font-normal">{Object.entries(SKILL_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}</select></label>
          <label className="block text-sm font-semibold text-[#40554a]">分钟<input type="number" min="5" max="180" value={draft.durationMinutes} onChange={(event) => setDraft({ ...draft, durationMinutes: Number(event.target.value) })} className="focus-ring mt-2 w-full rounded-xl border border-[#dce5df] px-3 py-3 font-normal" /></label>
        </div>
        <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>取消</Button><Button type="submit">保存任务</Button></div>
      </form>
    </Modal>

    <Modal open={Boolean(confirming)} onClose={() => setConfirming(null)} title="确认本次完成">
      <p className="text-sm leading-7 text-[#64756b]">这项任务还没有达到建议计时长度。若你已在别处完成，可以手动确认；系统会把它记录为用户确认，而不是仅因打开页面就自动完成。</p>
      <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={() => setConfirming(null)}>继续学习</Button><Button onClick={async () => { if (confirming) await store.setTaskStatus(confirming.id, 'completed', 'manual_confirmation'); setConfirming(null) }}>我确认已完成</Button></div>
    </Modal>
  </div>
}
