import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AppLayout } from './components/layout/AppLayout'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage'
import { DashboardPage } from './pages/app/DashboardPage'
import { ContactsPage } from './pages/app/ContactsPage'
import { CampaignsPage } from './pages/app/CampaignsPage'
import { NewCampaignPage } from './pages/app/NewCampaignPage'
import { ListsPage } from './pages/app/ListsPage'
import { AutomationsPage } from './pages/app/AutomationsPage'
import { ReportsPage } from './pages/app/ReportsPage'
import { AiAssistantPage } from './pages/app/AiAssistantPage'
import { SettingsPage } from './pages/app/SettingsPage'
import { Loader2 } from 'lucide-react'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    )
  }
  if (!session) return <Navigate to="/auth/login" replace />
  return <>{children}</>
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-400" size={24} />
      </div>
    )
  }
  if (session) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth */}
      <Route path="/auth/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
      <Route path="/auth/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
      <Route path="/auth/forgot-password" element={<RequireGuest><ForgotPasswordPage /></RequireGuest>} />

      {/* App */}
      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="lists" element={<ListsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="campaigns/new" element={<NewCampaignPage />} />
        <Route path="automations" element={<AutomationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="ai" element={<AiAssistantPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/billing" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
