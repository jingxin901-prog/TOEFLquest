import { useEffect } from 'react'
import { useQuestStore } from '../hooks/useQuestStore'
import { dateKeyInTimeZone } from '../lib/date'

export function NotificationManager() {
  const store = useQuestStore()
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const check = () => {
      const now = new Date()
      const time = new Intl.DateTimeFormat('en-GB', { timeZone: store.profile.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
      const today = dateKeyInTimeZone(now, store.profile.timezone)
      const key = `toefl-quest:notified:${today}`
      const pending = store.tasks.some((task) => task.scheduledDate === today && task.status === 'todo')
      if (time === store.profile.reminderTime && pending && !localStorage.getItem(key)) {
        new Notification('TOEFL Quest · 今日路线', { body: '先完成最短的一项吧。10 分钟也算认真前进。' })
        localStorage.setItem(key, '1')
      }
    }
    check()
    const timer = window.setInterval(check, 30_000)
    return () => window.clearInterval(timer)
  }, [store.profile.reminderTime, store.profile.timezone, store.tasks])
  return null
}
