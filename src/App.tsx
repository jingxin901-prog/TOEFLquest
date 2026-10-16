import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { NotificationManager } from './components/NotificationManager'
import { Onboarding } from './components/Onboarding'
import { QuestStoreProvider } from './hooks/useQuestStore'
import { TimerProvider } from './hooks/useTimer'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { CalendarPage } from './pages/CalendarPage'
import { DashboardPage } from './pages/DashboardPage'
import { PlanPage } from './pages/PlanPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return <QuestStoreProvider>
    <TimerProvider>
      <HashRouter>
        <NotificationManager />
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/plan" element={<PlanPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </AppShell>
        <Onboarding />
      </HashRouter>
    </TimerProvider>
  </QuestStoreProvider>
}
