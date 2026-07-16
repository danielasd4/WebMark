import { NavLink, useNavigate } from 'react-router-dom'
import {
  Users, Mail,
  Settings, LogOut,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { initials } from '../../lib/utils'

const nav = [
  { label: 'Contatos', icon: Users, to: '/app/contacts' },
  { label: 'Campanhas', icon: Mail, to: '/app/campaigns' },
]

const bottomNav = [
  { label: 'Configurações', icon: Settings, to: '/app/settings' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/auth/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-zinc-100 flex flex-col">
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-zinc-100">
        <NavLink to="/app/contacts" className="flex items-center">
          <img src="/Identidade Visual/Group 1.png" alt="WebMark" className="h-8 w-auto" />
        </NavLink>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-0.5">
          {nav.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-zinc-100 space-y-0.5">
        {bottomNav.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>

        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg hover:bg-zinc-50 cursor-pointer">
            <div className="w-7 h-7 bg-zinc-200 rounded-full flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-zinc-600">
                {initials(user.user_metadata?.full_name || user.email || 'U')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-900 truncate">
                {user.user_metadata?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
