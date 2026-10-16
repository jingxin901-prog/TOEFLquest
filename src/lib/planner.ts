import { addDays } from './date'
import { createId, type LearnerProfile, type Skill, type StudyTask } from '../types'

const templates: Record<Skill, Array<{ title: string; description: string }>> = {
  reading: [
    { title: 'Complete the Words 语境补词', description: '完成一组短文语境补词，标记词形与搭配线索。' },
    { title: 'Read in Daily Life 快速阅读', description: '阅读校园通知或日常信息，练习目的、细节与推断。' },
    { title: 'Read an Academic Passage', description: '精读学术短文一段，用一句英文写出段落功能。' },
  ],
  listening: [
    { title: 'Listen and Choose a Response', description: '听短对话并选择自然回应，记录干扰项原因。' },
    { title: '校园通知精听', description: '完成 Listen to an Announcement 练习并复盘信息层级。' },
    { title: 'Academic Talk 笔记训练', description: '听一段学术讲座，只记录结构词、例子与结论。' },
  ],
  speaking: [
    { title: 'Listen and Repeat 跟读', description: '逐句复述，关注信息完整度、重音与可懂度。' },
    { title: 'Take an Interview', description: '完成一组校园情境模拟采访，每题先结论后例子。' },
    { title: '口语回听与自评', description: '回听录音，从流利度、发音、语法各记一条改进。' },
  ],
  writing: [
    { title: 'Build a Sentence', description: '完成句子重组，复盘从句、修饰语与语序。' },
    { title: 'Write an Email', description: '完成一封校园情境邮件，检查目的、语气与行动请求。' },
    { title: 'Academic Discussion', description: '写一段学术讨论回应，提出观点并用例子展开。' },
  ],
  vocabulary: [
    { title: '高频词主动回忆', description: '复习到期词汇；先回忆，再查看释义与例句。' },
    { title: '主题词块积累', description: '围绕兴趣主题记录 8 个词块并各写一句。' },
    { title: '错词复盘', description: '整理今日练习中的生词与易混词。' },
  ],
}

const skillOrder: Skill[] = ['reading', 'listening', 'speaking', 'writing', 'vocabulary']

export function generateTasksForDay(profile: LearnerProfile, date: string, totalMinutes = profile.dailyMinutes, seed = 0): StudyTask[] {
  const minutes = Math.max(10, Math.min(180, Math.round(totalMinutes)))
  const blockSize = minutes <= 60 ? 20 : 25
  const blocks: number[] = [Math.min(10, minutes)]
  let remaining = minutes - blocks[0]
  while (remaining > 0) {
    const slots = Math.ceil(remaining / blockSize)
    const next = Math.ceil(remaining / slots)
    blocks.push(next)
    remaining -= next
  }
  const ordered = profile.prioritySkill
    ? [profile.prioritySkill, ...skillOrder.filter((skill) => skill !== profile.prioritySkill)]
    : skillOrder

  return blocks.map((durationMinutes, index) => {
    const skill = ordered[(index + seed) % ordered.length]
    const recipe = templates[skill][(seed + index) % templates[skill].length]
    return {
      id: createId(),
      title: recipe.title,
      description: recipe.description,
      scheduledDate: date,
      skill,
      durationMinutes,
      status: 'todo',
      source: 'rule',
      isMinimumTask: index === 0,
      createdAt: new Date().toISOString(),
    }
  })
}

export function generateWeek(profile: LearnerProfile, startDate: string, completionRate = 1) {
  const adaptiveMinutes = completionRate < 0.55 ? Math.max(10, Math.round(profile.dailyMinutes * 0.75)) : profile.dailyMinutes
  return Array.from({ length: 7 }, (_, index) => generateTasksForDay(profile, addDays(startDate, index), adaptiveMinutes, index))
    .flat()
}

export const updatedToeflModules = [
  { skill: '阅读', detail: 'Complete the Words · Read in Daily Life · Read an Academic Passage', count: '按 ETS 2026 Blueprint 训练' },
  { skill: '听力', detail: 'Choose a Response · Conversation · Announcement · Academic Talk', count: '按 ETS 2026 Blueprint 训练' },
  { skill: '写作', detail: 'Build a Sentence · Write an Email · Academic Discussion', count: '按 ETS 2026 Blueprint 训练' },
  { skill: '口语', detail: 'Listen and Repeat · Take an Interview', count: '按 ETS 2026 Blueprint 训练' },
]
