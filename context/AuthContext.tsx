'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ChangePasswordData, User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (token: string) => Promise<void>
  signOut: () => void
  changePassword: (data: ChangePasswordData) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchMe = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data)
      } else {
        localStorage.removeItem('token')
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to fetch user info', error)
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      fetchMe(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const signIn = async (token: string) => {
    localStorage.setItem('token', token)
    await fetchMe(token)
    router.push('/')
  }

  const signOut = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  const changePassword = async (data: ChangePasswordData) => {
    const token = localStorage.getItem('token')

    if (!token) {
      throw new Error('Please sign in again.')
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/change_password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const message =
        typeof errorData?.message === 'string'
          ? errorData.message
          : 'Failed to change password.'

      throw new Error(message)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        changePassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
