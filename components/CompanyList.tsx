'use client'

import Link from 'next/link'
import { Company } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Edit2, Trash2 } from 'lucide-react'

interface CompanyListProps {
  companies: Company[]
  onDelete: (id: string) => void
  startNumber?: number
}

export function CompanyList({
  companies,
  onDelete,
  startNumber = 1,
}: CompanyListProps) {
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
    <Card className="bg-card border-2 border-border p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-secondary/20">
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                No
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                English Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Khmer Name
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Entity Code
              </th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr
                key={company.id}
                className="border-b border-border/70 hover:bg-secondary/20 transition-colors"
              >
                <td className="py-3 px-4 text-muted-foreground">
                  {startNumber + index}
                </td>
                <td className="py-3 px-4 text-foreground">
                  {company.englishName}
                </td>
                <td className="py-3 px-4 text-foreground">
                  {company.khmerName}
                </td>
                <td className="py-3 px-4 font-mono text-foreground">
                  {company.entityCode || 'N/A'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
