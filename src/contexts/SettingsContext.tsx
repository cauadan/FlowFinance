import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSettings } from '@/lib/api'
import type { Settings } from '@/lib/api'
import { translations } from '@/lib/translations'
import { useNavigate, useLocation } from 'react-router'

interface SettingsContextProps {
  settings: Settings | undefined
  isLoading: boolean
  t: (key: string) => string
  currency: string
  language: string
}

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [hasRedirected, setHasRedirected] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  const language = settings?.language || 'en'
  const currency = settings?.currency || 'USD'

  // Apply theme & language document properties
  useEffect(() => {
    if (!settings) return

    // 1. Language HTML attribute
    document.documentElement.lang = settings.language

    // 2. Theme CSS class
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    if (settings.theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(settings.theme)
    }
  }, [settings])

  // 3. Handle default startup view redirection
  useEffect(() => {
    if (!isLoading && settings && !hasRedirected) {
      setHasRedirected(true)
      const currentPath = location.pathname
      const defaultView = settings.defaultView || 'dashboard'

      if (currentPath === '/') {
        if (defaultView === 'transactions') {
          navigate('/transactions', { replace: true })
        } else if (defaultView === 'budgets') {
          navigate('/budgets', { replace: true })
        }
      }
    }
  }, [settings, isLoading, navigate, location, hasRedirected])

  // Translate helper function
  const t = (key: string): string => {
    const langDict = translations[language] || translations['en']
    return langDict[key] || translations['en'][key] || key
  }

  return (
    <SettingsContext.Provider value={{ settings, isLoading, t, currency, language }}>
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
