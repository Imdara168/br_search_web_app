'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Company, CompanyFormData, Registration } from '@/lib/types'
import { useAuth } from '@/context/AuthContext'

interface CompanyContextType {
  companies: Company[]
  isLoading: boolean
  addCompany: (data: CompanyFormData) => void
  bulkAddCompanies: (data: CompanyFormData[]) => void
  updateCompany: (id: string, data: CompanyFormData) => void
  deleteCompany: (id: string) => void
  searchCompanies: (query: string) => void
  getCompanyById: (id: string) => Company | undefined
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchRegistrations = useCallback(async (query: string = '') => {
    if (!isAuthenticated) return

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = new URL(`${API_BASE_URL}/api/v1/search-registrations`)
      if (query) {
        url.searchParams.append('query', query)
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: Registration[] = await response.json()
        const mappedCompanies: Company[] = data.map((reg) => ({
          id: reg.slug, 
          englishName: reg.name_en,
          khmerName: reg.name_kh || '',
          slug: reg.slug,
          createdAt: new Date().toISOString(),
        }))
        setCompanies(mappedCompanies)
      }
    } catch (error) {
      console.error('Failed to search registrations', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (isAuthenticated) {
      fetchRegistrations('')
    } else {
      setCompanies([])
    }
  }, [isAuthenticated, fetchRegistrations])

  const addCompany = useCallback((data: CompanyFormData) => {
    const newCompany: Company = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    }
    setCompanies((prev) => [newCompany, ...prev])
  }, [])

  const bulkAddCompanies = useCallback((data: CompanyFormData[]) => {
    const newCompanies: Company[] = data.map((company, index) => ({
      id: (Date.now() + index).toString(),
      ...company,
      createdAt: new Date().toISOString(),
    }))
    setCompanies((prev) => [...newCompanies, ...prev])
  }, [])

  const updateCompany = useCallback(async (slug: string, data: CompanyFormData) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/registrations/edit/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name_en: data.englishName,
          name_kh: data.khmerName
        }),
      })

      if (!response.ok) throw new Error('Failed to update registration')
      
      const result = await response.json()
      // Refresh the list
      fetchRegistrations('')
      return result
    } catch (error) {
      console.error('Update failed', error)
      throw error
    }
  }, [fetchRegistrations])

  const deleteCompany = useCallback(async (slug: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_BASE_URL}/api/v1/registrations/delete/${slug}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) throw new Error('Failed to delete registration')
      
      const result = await response.json()
      // Refresh the list
      fetchRegistrations('')
      return result
    } catch (error) {
      console.error('Delete failed', error)
      throw error
    }
  }, [fetchRegistrations])

  const searchCompanies = useCallback((query: string) => {
    fetchRegistrations(query)
  }, [fetchRegistrations])

  const getCompanyById = useCallback((id: string): Company | undefined => {
    return companies.find((company) => company.id === id)
  }, [companies])

  return (
    <CompanyContext.Provider
      value={{
        companies,
        isLoading,
        addCompany,
        bulkAddCompanies,
        updateCompany,
        deleteCompany,
        searchCompanies,
        getCompanyById,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within CompanyProvider')
  }
  return context
}
