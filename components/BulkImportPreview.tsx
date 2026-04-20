'use client'

import { useState, useMemo } from 'react'
import { CompanyFormData } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const ITEMS_PER_PAGE = 50

interface BulkImportPreviewProps {
  companies: CompanyFormData[]
  onImport: (companies: CompanyFormData[]) => void
  isLoading?: boolean
  isDuplicate?: (englishName: string) => boolean
}

export function BulkImportPreview({
  companies,
  onImport,
  isLoading = false,
  isDuplicate = () => false,
}: BulkImportPreviewProps) {
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(companies.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedCompanies = companies.slice(startIndex, endIndex)

  const duplicateCount = useMemo(() => {
    return companies.filter((company) => isDuplicate(company.englishName)).length
  }, [companies, isDuplicate])

  const handleImport = () => {
    const validCompanies: CompanyFormData[] = []
    const duplicates: string[] = []

    companies.forEach((company) => {
      if (isDuplicate(company.englishName)) {
        duplicates.push(company.englishName)
      } else {
        validCompanies.push(company)
      }
    })

    if (duplicates.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Duplicates Found',
        description: `${duplicates.length} company(ies) already exist and will be skipped`,
      })
    }

    if (validCompanies.length > 0) {
      onImport(validCompanies)
    }
  }

  return (
    <Card className="bg-card border-border p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            Preview ({companies.length} companies)
          </h3>
          <p className="text-sm text-muted-foreground">
            {duplicateCount > 0 ? (
              <>
                Found {companies.length} companies ({duplicateCount} duplicates will be skipped)
              </>
            ) : (
              'All companies are ready to import'
            )}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  #
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  English Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Khmer Name
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.map((company, index) => (
                <tr
                  key={startIndex + index}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-4 text-muted-foreground">
                    {startIndex + index + 1}
                  </td>
                  <td className="py-3 px-4 text-foreground">{company.englishName}</td>
                  <td className="py-3 px-4 text-foreground">{company.khmerName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({companies.length} total companies)
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={handleImport}
          disabled={isLoading || companies.length === 0}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? 'Importing...' : `Import ${companies.length - duplicateCount} Companies`}
        </Button>
      </div>
    </Card>
  )
}
