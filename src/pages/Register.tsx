import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { CircleDollarSign, Mail, Lock, Eye, EyeOff, ArrowRight, User, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { translations } from '@/lib/translations'

function useAuthTranslation() {
  const lang = useMemo(() => {
    try {
      const stored = localStorage.getItem('flowfinance-language')
      if (stored && translations[stored]) return stored
    } catch {}
    const browserLang = navigator.language?.slice(0, 2)
    if (browserLang && translations[browserLang]) return browserLang
    return 'en'
  }, [])

  const t = (key: string) => translations[lang]?.[key] || translations['en']?.[key] || key
  return { t, lang }
}

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const { t } = useAuthTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError(t('register.password_min'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('register.password_mismatch'))
      return
    }

    setIsSubmitting(true)
    try {
      await register(name, email, password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || t('register.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center"
        style={{
          background: 'linear-gradient(135deg, #2f3e46 0%, #354f52 30%, #52796f 60%, #84a98c 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 40%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 flex flex-col items-center gap-6 px-12 text-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl">
            <CircleDollarSign className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-serif text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            FlowFinance
          </h1>
          <p className="max-w-sm text-lg text-white/70">
            {t('register.branding_desc')}
          </p>
          <div className="mt-8 flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm text-white/80">{t('register.branding_badge')}</span>
          </div>
        </motion.div>

        {/* Decorative circles */}
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/5" />
      </div>

      {/* Right Panel — Register Form */}
      <div className="flex w-full flex-col items-center justify-center bg-[#fafaf5] px-6 lg:w-1/2 lg:px-16">
        {/* Mobile Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center gap-2 lg:hidden"
        >
          <CircleDollarSign className="h-8 w-8 text-[#84a98c]" />
          <span className="font-serif text-2xl font-bold text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
            FlowFinance
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0c0a09]">{t('register.title')}</h2>
            <p className="mt-1 text-sm text-[#78716c]">{t('register.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#44403c]">{t('register.name')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t('register.name_placeholder')}
                  className="w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pl-10 pr-4 text-sm text-[#0c0a09] placeholder:text-[#a8a29e] transition-all focus:border-[#84a98c] focus:outline-none focus:ring-2 focus:ring-[#84a98c]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#44403c]">{t('register.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pl-10 pr-4 text-sm text-[#0c0a09] placeholder:text-[#a8a29e] transition-all focus:border-[#84a98c] focus:outline-none focus:ring-2 focus:ring-[#84a98c]/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#44403c]">{t('register.password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t('register.password_placeholder')}
                  className="w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pl-10 pr-10 text-sm text-[#0c0a09] placeholder:text-[#a8a29e] transition-all focus:border-[#84a98c] focus:outline-none focus:ring-2 focus:ring-[#84a98c]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a29e] hover:text-[#0c0a09] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#44403c]">{t('register.confirm')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={t('register.confirm_placeholder')}
                  className="w-full rounded-lg border border-[rgba(0,0,0,0.08)] bg-white py-2.5 pl-10 pr-4 text-sm text-[#0c0a09] placeholder:text-[#a8a29e] transition-all focus:border-[#84a98c] focus:outline-none focus:ring-2 focus:ring-[#84a98c]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f3e46] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#354f52] hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  {t('register.submit')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#78716c]">
            {t('register.has_account')}{' '}
            <Link to="/login" className="font-medium text-[#84a98c] hover:text-[#52796f] transition-colors">
              {t('register.signin')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
