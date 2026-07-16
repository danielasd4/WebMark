import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { OnboardingWelcome } from '../OnboardingWelcome'

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
      <OnboardingWelcome />
    </div>
  )
}
