import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Globe, Database } from 'lucide-react'
import { getSettings, updateSettings } from '@/lib/api'
import type { Settings as SettingsType } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

import { useSettings } from '@/contexts/SettingsContext'

export default function Settings() {
  const queryClient = useQueryClient()
  const { t } = useSettings()

  // Form State
  const [currency, setCurrency] = useState('USD')
  const [language, setLanguage] = useState('en')
  const [theme, setTheme] = useState('system')
  const [defaultView, setDefaultView] = useState('dashboard')
  const [autoBackup, setAutoBackup] = useState(false)
  const [backupInterval, setBackupInterval] = useState('weekly')

  // Queries
  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  // Sync state with settings query data
  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency)
      setLanguage(settings.language)
      setTheme(settings.theme)
      setDefaultView(settings.defaultView || 'dashboard')
      setAutoBackup(settings.autoBackup)
      setBackupInterval(settings.backupInterval)
    }
  }, [settings])

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data)
      toast.success(t('settings.success'))
    },
    onError: () => toast.error(t('settings.error')),
  })

  const handleSettingChange = (field: keyof SettingsType, value: any) => {
    // Update local state for immediate feedback
    if (field === 'currency') setCurrency(value)
    if (field === 'language') setLanguage(value)
    if (field === 'theme') {
      setTheme(value)
      // Apply theme immediately
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      if (value === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(value)
      }
    }
    if (field === 'defaultView') setDefaultView(value)
    if (field === 'autoBackup') setAutoBackup(value)
    if (field === 'backupInterval') setBackupInterval(value)

    // Auto-save to API
    const data: Partial<SettingsType> = {
      currency,
      language,
      theme,
      defaultView,
      autoBackup,
      backupInterval,
      [field]: value
    }

    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6 max-w-2xl"
    >
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
          {t('settings.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <div>
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Preferences Group */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2 mb-2">
                <Globe className="h-4 w-4" /> {t('settings.preferences')}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Currency */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">{t('settings.currency')}</Label>
                  <Select value={currency} onValueChange={(val) => handleSettingChange('currency', val)}>
                    <SelectTrigger className="border-border bg-card dark:bg-[#181b22] text-foreground focus:ring-[#84a98c]">
                      <SelectValue placeholder={t('settings.currency.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                      <SelectItem value="BRL">BRL (R$) - Brazilian Real</SelectItem>
                      <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                      <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                      <SelectItem value="JPY">JPY (¥) - Japanese Yen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">{t('settings.language')}</Label>
                  <Select value={language} onValueChange={(val) => handleSettingChange('language', val)}>
                    <SelectTrigger className="border-border bg-card dark:bg-[#181b22] text-foreground focus:ring-[#84a98c]">
                      <SelectValue placeholder={t('settings.language.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Theme */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">{t('settings.theme')}</Label>
                  <Select value={theme} onValueChange={(val) => handleSettingChange('theme', val)}>
                    <SelectTrigger className="border-border bg-card dark:bg-[#181b22] text-foreground focus:ring-[#84a98c]">
                      <SelectValue placeholder={t('settings.theme.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">{t('settings.theme.light')}</SelectItem>
                      <SelectItem value="dark">{t('settings.theme.dark')}</SelectItem>
                      <SelectItem value="system">{t('settings.theme.system')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default View */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground font-medium">{t('settings.startup')}</Label>
                  <Select value={defaultView} onValueChange={(val) => handleSettingChange('defaultView', val)}>
                    <SelectTrigger className="border-border bg-card dark:bg-[#181b22] text-foreground focus:ring-[#84a98c]">
                      <SelectValue placeholder={t('settings.startup.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">{t('nav.dashboard')}</SelectItem>
                      <SelectItem value="transactions">{t('nav.transactions')}</SelectItem>
                      <SelectItem value="budgets">{t('nav.budgets')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Backups Settings Group */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 border-b border-border pb-2 mb-2">
                <Database className="h-4 w-4" /> {t('settings.backups')}
              </h3>

              <div className="space-y-4 rounded-lg bg-background dark:bg-[#12141a] p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-foreground">{t('settings.backups.enable')}</Label>
                    <p className="text-xs text-muted-foreground">{t('settings.backups.desc')}</p>
                  </div>
                  <Switch checked={autoBackup} onCheckedChange={(val) => handleSettingChange('autoBackup', val)} />
                </div>

                {autoBackup && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-1.5 pt-3 border-t border-border"
                  >
                    <Label className="text-xs text-muted-foreground font-medium">{t('settings.backups.interval')}</Label>
                    <Select value={backupInterval} onValueChange={(val) => handleSettingChange('backupInterval', val)}>
                      <SelectTrigger className="border-border focus:ring-[#84a98c] bg-card dark:bg-[#181b22] text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">{t('settings.backups.daily')}</SelectItem>
                        <SelectItem value="weekly">{t('settings.backups.weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('settings.backups.monthly')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
