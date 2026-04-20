'use client'

import Link from 'next/link'
import { Company } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Edit2, Trash2 } from 'lucide-react'

interface CompanyListProps {
  companies: Company[]
  onDelete: (id: string) => void
}

export function CompanyList({ companies, onDelete }: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <Card className="bg-card border-border p-8 text-center">
        <p className="text-muted-foreground mb-4">No entities found</p>
        <Link href="/create">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Create First Entity
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {companies.map((company) => (
        <Card
          key={company.id}
          className="bg-card border-border p-4 hover:border-primary/50 transition-colors flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground font-medium truncate">
              {company.englishName}
            </h3>
            <p className="text-muted-foreground text-sm truncate">
              {company.khmerName}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              Created {new Date(company.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            <Link href={`/edit/${company.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-border hover:bg-secondary"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 hover:bg-destructive/10 text-destructive"
              onClick={() => onDelete(company.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
