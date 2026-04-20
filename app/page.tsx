'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCompany } from '@/context/CompanyContext'
import { useAuth } from '@/context/AuthContext'
import { SearchBar } from '@/components/SearchBar'
import { CompanyList } from '@/components/CompanyList'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Pagination } from '@/components/Pagination'
import { UserProfileMenu } from '@/components/UserProfileMenu'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ITEMS_PER_PAGE = 5

export default function HomePage() {
  const { searchCompanies, deleteCompany, companies, isLoading: isDataLoading } = useCompany()
  const { isLoading: isAuthLoading, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string
    name: string
  } | null>(null)

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthLoading, isAuthenticated, router])

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return companies.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [companies, currentPage])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page on search
    searchCompanies(query)
  }

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirm) {
      try {
        const result = await deleteCompany(deleteConfirm.id)
        toast({
          title: 'Success',
          description: result.message || `${deleteConfirm.name} has been deleted`,
        })
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to delete entity',
        })
      }
      setDeleteConfirm(null)
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <UserProfileMenu />
          </div>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Entities
            </h1>
            <p className="text-muted-foreground">Manage entity registrations</p>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/create">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <Plus className="h-5 w-5" />
                New Entity
              </Button>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar onSearch={handleSearchChange} />
        </div>

        {/* Entity List */}
        <div>
          {isDataLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery ? `No entities match your search "${searchQuery}"` : "No entities yet. Create your first entity to get started."}
              </p>
              {!searchQuery && (
                <Link href="/create">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    Create Entity
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <CompanyList
                companies={paginatedCompanies}
                onDelete={(id) => {
                  const company = companies.find((c) => c.id === id)
                  if (company) {
                    handleDeleteClick(id, company.englishName)
                  }
                }}
              />
              <Pagination
                currentPage={currentPage}
                totalItems={companies.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteConfirm}
        companyName={deleteConfirm?.name || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </main>
  )
}
