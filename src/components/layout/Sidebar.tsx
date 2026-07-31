import { Link, useLocation, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Receipt,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  Database,
  CircleDollarSign,
  Bot,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'

const navItems = [
  { path: '/', translationKey: 'nav.dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', translationKey: 'nav.transactions', label: 'Transactions', icon: Receipt },
  { path: '/goals', translationKey: 'nav.goals', label: 'Goals', icon: Target },
  { path: '/investments', translationKey: 'nav.investments', label: 'Investments', icon: TrendingUp },
  { path: '/analytics', translationKey: 'nav.analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/assistant', translationKey: 'nav.assistant', label: 'Assistant', icon: Bot },
  { path: '/settings', translationKey: 'nav.settings', label: 'Settings', icon: Settings },
  { path: '/backups', translationKey: 'nav.backups', label: 'Backups', icon: Database },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useSettings()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col border-r border-[rgba(0,0,0,0.05)] bg-[#f5f5f0] lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-center gap-2">
          <CircleDollarSign className="h-6 w-6 text-[#84a98c]" />
          <span className="font-serif text-xl tracking-tight text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
            FlowFinance
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
                isActive
                  ? 'bg-[#fafaf5] font-semibold text-[#0c0a09] shadow-sm'
                  : 'text-[#78716c] hover:bg-white hover:text-[#0c0a09] hover:shadow-sm'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-[#84a98c]"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn('h-[18px] w-[18px]', isActive ? 'text-[#84a98c]' : 'text-[#a8a29e] group-hover:text-[#0c0a09]')} />
              <span>{t(item.translationKey)}</span>
            </Link>
          )
        })}
      </nav>

      {/* Profile + Logout */}
      <div className="border-t border-[rgba(0,0,0,0.05)] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#84a98c] text-xs font-medium text-white">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0c0a09] truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-[#a8a29e] truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[#a8a29e] transition-colors hover:bg-red-50 hover:text-red-500"
            title={t('nav.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
