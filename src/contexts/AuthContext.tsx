import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginApi, registerApi, getCurrentUser } from '@/lib/api'

interface User {
  id: number
  name: string
  email: string
}

interface AuthContextProps {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('ff_token'))
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!token

  // Validate existing token on mount
  useEffect(() => {
    const validateToken = async () => {
      const storedToken = localStorage.getItem('ff_token')
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await getCurrentUser(storedToken)
        setUser(userData)
        setToken(storedToken)
      } catch {
        // Token is invalid or expired
        localStorage.removeItem('ff_token')
        localStorage.removeItem('ff_user')
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    validateToken()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginApi(email, password)
    localStorage.setItem('ff_token', result.token)
    localStorage.setItem('ff_user', JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    const result = await registerApi(name, email, password)
    localStorage.setItem('ff_token', result.token)
    localStorage.setItem('ff_user', JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ff_token')
    localStorage.removeItem('ff_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
