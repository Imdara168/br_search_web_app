'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [5, 10, 20, 30, 40, 50]

interface PaginationProps {
  currentPage: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (itemsPerPage: number) => void
}

export function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const start = (currentPage - 1) * itemsPerPage + 1
  const end = Math.min(currentPage * itemsPerPage, totalItems)

  const handleFirst = () => {
    if (currentPage > 1) {
      onPageChange(1)
    }
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1)
    }
  }

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1)
    }
  }

  const handleLast = () => {
    if (currentPage < totalPages) {
      onPageChange(totalPages)
    }
  }

  if (totalItems === 0) return null

  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {start} to {end} of <span className="font-semibold text-foreground">{totalItems}</span> entities
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show</span>
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => onItemsPerPageChange(Number(value))}
            >
              <SelectTrigger className="w-[92px] border-border bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 lg:mr-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFirst}
              disabled={currentPage === 1}
              className="border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First Page
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          <div className="flex items-center gap-2 px-1 py-1.5 text-sm whitespace-nowrap text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLast}
              disabled={currentPage === totalPages}
              className="border-border hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last Page
            </Button>
        </div>
      </div>
    </div>
  )
}
