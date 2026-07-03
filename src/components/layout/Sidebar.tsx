import { Link, useLocation } from 'react-router'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Wallet,
  Target,
  TrendingUp,
  BarChart3,
  Settings,
  Database,
  CircleDollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/categories', label: 'Categories', icon: Tags },
  { path: '/budgets', label: 'Budgets', icon: Wallet },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/investments', label: 'Investments', icon: TrendingUp },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/backups', label: 'Backups', icon: Database },
]

export default function Sidebar() {
  const location = useLocation()

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
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-[rgba(0,0,0,0.05)] p-4">
        <div className="flex items-center gap-3 rounded-lg bg-white/50 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#84a98c] text-xs font-medium text-white">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0c0a09] truncate">Local User</p>
            <p className="text-xs text-[#a8a29e]">Offline Mode</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
