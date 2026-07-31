import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Search, Plus, CircleDollarSign, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TransactionForm from '../transactions/TransactionForm'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'

export default function TopBar() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const { t, language } = useSettings()
  const { logout } = useAuth()

  const dateLocale = language === 'pt' ? 'pt-BR' : language === 'es' ? 'es-ES' : 'en-US'

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/transactions?query=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[rgba(0,0,0,0.05)] bg-[#fafaf5]/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 lg:px-8">
          {/* Mobile Logo */}
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <CircleDollarSign className="h-5 w-5 text-[#84a98c]" />
            <span className="font-serif text-lg tracking-tight text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
              FlowFinance
            </span>
          </Link>

          {/* Search */}
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]" />
            <Input
              placeholder={t('topbar.search')}
              className="border-[rgba(0,0,0,0.08)] bg-white pl-9 text-sm placeholder:text-[#a8a29e] focus-visible:ring-[#84a98c]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[#78716c] lg:block">
              {new Date().toLocaleDateString(dateLocale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <Button
              onClick={() => setShowForm(true)}
              className="rounded-full bg-[#84a98c] text-white hover:bg-[#2f3e46] gap-1.5 text-sm shadow-sm"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t('topbar.quick_add')}</span>
            </Button>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#a8a29e] transition-colors hover:bg-red-50 hover:text-red-500 lg:hidden"
              title={t('nav.logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm
          open={showForm}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  )
}
