'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

interface AuthContextType {
  isLoggedIn: boolean
  userName: string | null
  userKelas: string | null
  canEditKeterangan: boolean
  login: (password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [userKelas, setUserKelas] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check stored auth on mount only
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem('mutasi_auth_v2')
      if (storedAuth) {
        const authData = JSON.parse(storedAuth)
        setIsLoggedIn(true)
        setUserName(authData.nama)
        setUserKelas(authData.kelas || null)
      }
    } catch {
      localStorage.removeItem('mutasi_auth_v2')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const canEditKeterangan = userKelas === '1'

  const login = useCallback(async (password: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        setIsLoggedIn(true)
        setUserName(data.nama)
        setUserKelas(data.kelas || null)
        localStorage.setItem('mutasi_auth_v2', JSON.stringify({
          nama: data.nama,
          kelas: data.kelas || null,
          timestamp: Date.now()
        }))
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Login gagal' }
      }
    } catch {
      return { success: false, error: 'Terjadi kesalahan saat login' }
    }
  }, [])

  const logout = useCallback(() => {
    setIsLoggedIn(false)
    setUserName(null)
    setUserKelas(null)
    localStorage.removeItem('mutasi_auth_v2')
  }, [])

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      userName, 
      userKelas,
      canEditKeterangan,
      login, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
