import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Receipt,
  Bot,
  Menu,
  X,
  Tags,
  Wallet,
  Target,
  Shield,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'

export default function MobileNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useSettings()
  const { user, logout } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = () => {
    setDrawerOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const allMenuItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard, color: 'bg-emerald-50 text-emerald-600' },
    { path: '/transactions', label: t('nav.transactions'), icon: Receipt, color: 'bg-blue-50 text-blue-600' },
    { path: '/categories', label: t('nav.categories'), icon: Tags, color: 'bg-amber-50 text-amber-600' },
    { path: '/budgets', label: t('nav.budgets'), icon: Wallet, color: 'bg-purple-50 text-purple-600' },
    { path: '/goals', label: t('nav.goals'), icon: Target, color: 'bg-teal-50 text-teal-600' },
    { path: '/emergency-fund', label: t('nav.emergency_fund'), icon: Shield, color: 'bg-rose-50 text-rose-600' },
    { path: '/investments', label: t('nav.investments'), icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600' },
    { path: '/analytics', label: t('nav.analytics'), icon: BarChart3, color: 'bg-cyan-50 text-cyan-600' },
    { path: '/assistant', label: t('nav.assistant'), icon: Bot, color: 'bg-emerald-50 text-emerald-600' },
    { path: '/settings', label: t('nav.settings'), icon: Settings, color: 'bg-stone-100 text-stone-700' },
  ]

  const mainBarItems = [
    { path: '/', label: t('mobile.home'), icon: LayoutDashboard },
    { path: '/transactions', label: t('mobile.transactions'), icon: Receipt },
    { path: '/assistant', label: t('mobile.assistant'), icon: Bot },
  ]

  return (
    <>
      {/* Bottom Floating/Fixed Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 dark:bg-[#12141a]/95 backdrop-blur-md shadow-lg lg:hidden">
        <div className="flex items-center justify-around px-2 py-1.5 safe-area-pb">
          {mainBarItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-medium transition-all',
                  isActive
                    ? 'text-[#84a98c]'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'stroke-[2.2]' : 'stroke-[1.8]')} />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-medium transition-all',
              drawerOpen || !mainBarItems.some((i) => i.path === location.pathname)
                ? 'text-[#84a98c]'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span>{t('mobile.more')}</span>
          </button>
        </div>
      </nav>

      {/* Slide-Up Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Content Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="absolute bottom-16 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-card dark:bg-[#181b22] p-5 shadow-2xl border-t border-border"
            >
              {/* Handle bar */}
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-700" />

              {/* User Header */}
              <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#84a98c] text-sm font-semibold text-white">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{user?.name || 'User'}</h3>
                    <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('nav.logout')}</span>
                </button>
              </div>

              {/* Grid of all features */}
              <div className="grid grid-cols-3 gap-2.5 pb-2">
                {allMenuItems.map((item) => {
                  const isActive = location.pathname === item.path
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        'flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center transition-all',
                        isActive
                          ? 'bg-[#84a98c]/15 text-foreground font-semibold ring-1 ring-[#84a98c]'
                          : 'bg-secondary/70 dark:bg-[#20242e] text-foreground hover:bg-secondary'
                      )}
                    >
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', item.color)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] leading-tight line-clamp-2">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

