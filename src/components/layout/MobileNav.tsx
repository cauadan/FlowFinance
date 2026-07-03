import { Link, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileItems = [
  { path: '/', label: 'Home', icon: LayoutDashboard },
  { path: '/transactions', label: 'Txns', icon: Receipt },
  { path: '/budgets', label: 'Budgets', icon: Wallet },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/settings', label: 'More', icon: Settings },
]

export default function MobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(0,0,0,0.05)] bg-white lg:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {mobileItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs transition-colors',
                isActive
                  ? 'font-medium text-[#84a98c]'
                  : 'text-[#a8a29e]'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
