'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useCompany } from '@/context/CompanyContext'
import { useAuth } from '@/context/AuthContext'
import { CompanyForm } from '@/components/CompanyForm'
import { Company, CompanyFormData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const { updateCompany, getCompanyById, companies } = useCompany()
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)

  const id = params.id as string

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated) {
      const foundCompany = getCompanyById(id)
      if (foundCompany) {
        setCompany(foundCompany)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Entity not found',
        })
        router.push('/')
      }
    }
  }, [id, getCompanyById, router, toast, isAuthenticated])

  const isDuplicate = (englishName: string, currentName?: string) => {
    const normalizedInput = englishName.toLowerCase().replace(/[\s,.]/g, '')
    const normalizedCurrent = currentName?.toLowerCase().replace(/[\s,.]/g, '') || ''

    if (normalizedInput === normalizedCurrent) {
      return false // Same entity, not a duplicate
    }

    return companies.some((company) => {
      const normalizedExisting = company.englishName.toLowerCase().replace(/[\s,.]/g, '')
      return normalizedExisting === normalizedInput
    })
  }

  const handleSubmit = async (data: CompanyFormData) => {
    setIsLoading(true)
    try {
      const result = await updateCompany(id, data)
      toast({
        title: 'Success',
        description: result.message || `${data.englishName} has been updated`,
      })
      router.push('/')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update entity',
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

  if (!company) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
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
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">
              Edit Entity
            </h1>
            <p className="text-muted-foreground text-sm font-mono mb-2">
              ID: {company.slug}
            </p>
            <p className="text-muted-foreground">
              Update entity information
            </p>
          </div>

          <CompanyForm
            initialData={{
              englishName: company.englishName,
              khmerName: company.khmerName
            }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitButtonLabel="Update Entity"
            isDuplicate={isDuplicate}
          />
        </div>
      </div>
    </main>
  )
}
