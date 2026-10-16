export function dateKeyInTimeZone(date = new Date(), timeZone = 'Asia/Shanghai') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${pick('year')}-${pick('month')}-${pick('day')}`
}

export function parseDateKey(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12))
}

export function addDays(key: string, amount: number) {
  const date = parseDateKey(key)
  date.setUTCDate(date.getUTCDate() + amount)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function formatDate(key: string, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
    ...options,
  }).format(parseDateKey(key))
}

export function monthLabel(monthKey: string) {
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(parseDateKey(`${monthKey}-01`))
}

export function monthGrid(monthKey: string) {
  const first = parseDateKey(`${monthKey}-01`)
  const mondayOffset = (first.getUTCDay() + 6) % 7
  const startKey = addDays(`${monthKey}-01`, -mondayOffset)
  return Array.from({ length: 42 }, (_, index) => addDays(startKey, index))
}

export function moveMonth(monthKey: string, amount: number) {
  const date = parseDateKey(`${monthKey}-01`)
  date.setUTCMonth(date.getUTCMonth() + amount)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function daysUntil(dateKey: string, fromKey: string) {
  return Math.max(0, Math.ceil((parseDateKey(dateKey).getTime() - parseDateKey(fromKey).getTime()) / 86_400_000))
}

export function startOfWeek(key: string) {
  const date = parseDateKey(key)
  const mondayOffset = (date.getUTCDay() + 6) % 7
  return addDays(key, -mondayOffset)
}
