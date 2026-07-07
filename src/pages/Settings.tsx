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

export default function Settings() {
  const queryClient = useQueryClient()

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
      toast.success('Settings updated successfully')
    },
    onError: () => toast.error('Failed to update settings'),
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
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[#0c0a09]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Settings
        </h1>
        <p className="text-sm text-[#78716c]">
          Manage your currency, default startup page, theme preferences, and data backups.
        </p>
      </div>

      <div>
        <Card className="border-[rgba(0,0,0,0.05)] bg-white shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Preferences Group */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716c] flex items-center gap-1.5 border-b border-[rgba(0,0,0,0.04)] pb-2 mb-2">
                <Globe className="h-4 w-4" /> Preferences
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Currency */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-stone-600 font-medium">Currency Symbol</Label>
                  <Select value={currency} onValueChange={(val) => handleSettingChange('currency', val)}>
                    <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c]">
                      <SelectValue placeholder="Select currency" />
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
                  <Label className="text-xs text-stone-600 font-medium">Language</Label>
                  <Select value={language} onValueChange={(val) => handleSettingChange('language', val)}>
                    <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c]">
                      <SelectValue placeholder="Select language" />
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
                  <Label className="text-xs text-stone-600 font-medium">Theme Mode</Label>
                  <Select value={theme} onValueChange={(val) => handleSettingChange('theme', val)}>
                    <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c]">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light Mode</SelectItem>
                      <SelectItem value="dark">Dark Mode (Beta)</SelectItem>
                      <SelectItem value="system">System Default</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default View */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-stone-600 font-medium">Default View on Startup</Label>
                  <Select value={defaultView} onValueChange={(val) => handleSettingChange('defaultView', val)}>
                    <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c]">
                      <SelectValue placeholder="Select startup page" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="transactions">Transactions</SelectItem>
                      <SelectItem value="budgets">Budgets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Backups Settings Group */}
            <div className="space-y-4 pt-4 border-t border-[rgba(0,0,0,0.05)]">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#78716c] flex items-center gap-1.5 border-b border-[rgba(0,0,0,0.04)] pb-2 mb-2">
                <Database className="h-4 w-4" /> Automatic Backups
              </h3>

              <div className="space-y-4 rounded-lg bg-[#fafaf5] p-4 border border-[rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-[#0c0a09]">Enable Automatic Backups</Label>
                    <p className="text-xs text-[#a8a29e]">Create database copies automatically in the background</p>
                  </div>
                  <Switch checked={autoBackup} onCheckedChange={(val) => handleSettingChange('autoBackup', val)} />
                </div>

                {autoBackup && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="space-y-1.5 pt-3 border-t border-[rgba(0,0,0,0.05)]"
                  >
                    <Label className="text-xs text-stone-600 font-medium">Backup Interval</Label>
                    <Select value={backupInterval} onValueChange={(val) => handleSettingChange('backupInterval', val)}>
                      <SelectTrigger className="border-[rgba(0,0,0,0.1)] focus:ring-[#84a98c] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
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
