'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCompany } from '@/context/CompanyContext'
import { useAuth } from '@/context/AuthContext'
import { CompanyForm } from '@/components/CompanyForm'
import { ExcelUpload } from '@/components/ExcelUpload'
import { BulkImportPreview } from '@/components/BulkImportPreview'
import { CompanyFormData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CreatePage() {
  const router = useRouter()
  const { addCompany, companies, refreshCompanies } = useCompany()
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [excelData, setExcelData] = useState<CompanyFormData[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthLoading, isAuthenticated, router])

  useEffect(() => {
    if (excelData.length === 0) {
      setIsPreviewOpen(false)
    }
  }, [excelData])

  const isDuplicate = (englishName: string) => {
    const normalizedInput = englishName.toLowerCase().replace(/[\s,.]/g, '')
    return companies.some((company) => {
      const normalizedExisting = company.englishName.toLowerCase().replace(/[\s,.]/g, '')
      return normalizedExisting === normalizedInput
    })
  }

  const handleSubmit = async (data: CompanyFormData) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/registrations/create`, {
        method: 'POST',
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

      if (!response.ok) {
        throw new Error('Failed to create registration')
      }
      
      const result = await response.json()
      
      // Update local state via context if needed, or just re-fetch on home
      addCompany(data) 
      
      toast({
        title: 'Success',
        description: result.message || `${data.englishName} has been created`,
      })
      router.push('/')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create entity',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBulkImport = async (data: CompanyFormData[]) => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

      const response = await fetch(`${baseUrl}/api/v1/registrations/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: data.map(item => ({
            name_en: item.englishName,
            name_kh: item.khmerName,
            entity_code: item.entityCode,
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to import entities')
      }

      const result = await response.json()
      
      await refreshCompanies()
      setExcelData([])
      toast({
        title: 'Success',
        description: result.message || 'Import Successfully!',
      })
      router.push('/')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to import entities',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <Link href="/">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground gap-2 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Entities
          </Button>
        </Link>

        {/* Form Section */}
        <div className="space-y-6">
          <div className="mx-auto w-full max-w-4xl">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Create New Entity
            </h1>
            <p className="text-muted-foreground">
              Add a new entity to your list or import from Excel
            </p>
          </div>

          <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2 md:items-stretch">
            <div className="w-full">
              <CompanyForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                submitButtonLabel="Create Entity"
                isDuplicate={isDuplicate}
                title="Create Manually"
                description="Fill in the fields below to add one entity at a time."
                className="h-full max-w-none"
              />
            </div>

            <div className="w-full">
              <ExcelUpload
                onDataLoaded={setExcelData}
                onPreviewRequested={() => setIsPreviewOpen(true)}
                previewCount={excelData.length}
                className="h-full max-w-none"
              />
            </div>
          </div>
        </div>

        {excelData.length > 0 && (
          <BulkImportPreview
            companies={excelData}
            onImport={handleBulkImport}
            isLoading={isLoading}
            isOpen={isPreviewOpen}
            onOpenChange={setIsPreviewOpen}
            isDuplicate={(englishName) => {
              const normalizedInput = englishName.toLowerCase().replace(/[\s,.]/g, '')
              return companies.some((company) => {
                const normalizedExisting = company.englishName.toLowerCase().replace(/[\s,.]/g, '')
                return normalizedExisting === normalizedInput
              })
            }}
          />
        )}
      </div>
    </main>
  )
}
