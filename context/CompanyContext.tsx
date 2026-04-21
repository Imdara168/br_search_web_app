'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  ApiMessageResponse,
  Company,
  CompanyFormData,
  PaginatedRegistrationsResponse,
} from '@/lib/types'
import { useAuth } from '@/context/AuthContext'

interface CompanyContextType {
  companies: Company[]
  totalCompanies: number
  isLoading: boolean
  addCompany: (data: CompanyFormData) => void
  bulkAddCompanies: (data: CompanyFormData[]) => void
  fetchCompanies: (params?: { query?: string; page?: number; limit?: number }) => Promise<void>
  refreshCompanies: () => Promise<void>
  updateCompany: (id: string, data: CompanyFormData) => Promise<ApiMessageResponse>
  deleteCompany: (id: string) => Promise<ApiMessageResponse>
  getCompanyById: (id: string) => Company | undefined
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [totalCompanies, setTotalCompanies] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const [lastPage, setLastPage] = useState(1)
  const [lastLimit, setLastLimit] = useState(10)

  const fetchCompanies = useCallback(async (
    params: { query?: string; page?: number; limit?: number; sortOrder?: 'asc' | 'desc' } = {},
  ) => {
    if (!isAuthenticated) return

    const query = params.query ?? lastQuery
    const page = params.page ?? lastPage
    const limit = params.limit ?? lastLimit
    const sort = params.sortOrder ?? 'asc' // Default to asc if not provided

    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const url = new URL(`${API_BASE_URL}/api/v1/search-registrations`)
      if (query) {
        url.searchParams.append('query', query)
      }
      url.searchParams.append('page', String(page))
      url.searchParams.append('limit', String(limit))
      url.searchParams.append('sort', sort)

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const result: PaginatedRegistrationsResponse = await response.json()
        const mappedCompanies: Company[] = result.data.map((reg) => ({
          id: reg.slug, 
          englishName: reg.name_en,
          khmerName: reg.name_kh || '',
          entityCode: reg.entity_code || '',
          slug: reg.slug,
          createdAt: reg.created_at || new Date().toISOString(),
        }))
        setLastQuery(query)
        setLastPage(page)
        setLastLimit(limit)
        setCompanies(mappedCompanies)
        setTotalCompanies(result.total)
      }
    } catch (error) {
      console.error('Failed to search registrations', error)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, lastLimit, lastPage, lastQuery])

  useEffect(() => {
    if (!isAuthenticated) {
      setCompanies([])
      setTotalCompanies(0)
    }
  }, [isAuthenticated])

  const addCompany = useCallback((data: CompanyFormData) => {
    const id = Date.now().toString()
    const newCompany: Company = {
      id,
      ...data,
      slug: id,
      createdAt: new Date().toISOString(),
    }
    setCompanies((prev) => [newCompany, ...prev])
  }, [])

  const bulkAddCompanies = useCallback((data: CompanyFormData[]) => {
    const newCompanies: Company[] = data.map((company, index) => {
      const id = (Date.now() + index).toString()

      return {
        id,
        ...company,
        slug: id,
        createdAt: new Date().toISOString(),
      }
    })
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
          name_kh: data.khmerName,
          entity_code: data.entityCode,
        }),
      })

      if (!response.ok) throw new Error('Failed to update registration')
      
      const result = await response.json()
      fetchCompanies()
      return result
    } catch (error) {
      console.error('Update failed', error)
      throw error
    }
  }, [fetchCompanies])

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
      fetchCompanies()
      return result
    } catch (error) {
      console.error('Delete failed', error)
      throw error
    }
  }, [fetchCompanies])

  const getCompanyById = useCallback((id: string): Company | undefined => {
    return companies.find((company) => company.id === id)
  }, [companies])

  const refreshCompanies = useCallback(async () => {
    await fetchCompanies()
  }, [fetchCompanies])

  return (
    <CompanyContext.Provider
      value={{
        companies,
        totalCompanies,
        isLoading,
        addCompany,
        bulkAddCompanies,
        fetchCompanies,
        refreshCompanies,
        updateCompany,
        deleteCompany,
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
