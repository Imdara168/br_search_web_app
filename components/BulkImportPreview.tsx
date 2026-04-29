'use client'

import { useEffect, useMemo, useState } from 'react'
import { CompanyFormData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const ITEMS_PER_PAGE = 50

interface BulkImportPreviewProps {
  companies: CompanyFormData[]
  onImport: (companies: CompanyFormData[]) => void
  isLoading?: boolean
  isDuplicate?: (englishName: string) => boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  fileName?: string | null
}

export function BulkImportPreview({
  companies,
  onImport,
  isLoading = false,
  isDuplicate = () => false,
  isOpen,
  onOpenChange,
  fileName,
}: BulkImportPreviewProps) {
  const { toast } = useToast()
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [companies])

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
        description: `${duplicates.length} entities already exist and will be skipped`,
      })
    }

    if (validCompanies.length > 0) {
      onImport(validCompanies)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card p-0 sm:max-w-5xl">
        <div className="space-y-4 p-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg text-foreground">
              Preview ({companies.length} entities)
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {duplicateCount > 0 ? (
                <>
                  {fileName ? `${fileName} contains ` : 'Found '}
                  {companies.length} entities ({duplicateCount} duplicates will be skipped)
                </>
              ) : (
                <>
                  {fileName ? `${fileName} is ready to import.` : 'All entities are ready to import.'}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[55vh] overflow-auto rounded-lg border border-border bg-background">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
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
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Entities Code
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedCompanies.map((company, index) => (
                  <tr
                    key={startIndex + index}
                    className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                  >
                    <td className="py-3 px-4 text-muted-foreground">
                      {startIndex + index + 1}
                    </td>
                    <td className="py-3 px-4 text-foreground">{company.englishName}</td>
                    <td className="py-3 px-4 text-foreground">{company.khmerName}</td>
                    <td className="py-3 px-4 font-mono text-foreground">{company.entityCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({companies.length} total entities)
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First Page
                </Button>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last Page
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              onClick={handleImport}
              disabled={isLoading || companies.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading ? 'Importing...' : `Import ${companies.length - duplicateCount} Entities`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
