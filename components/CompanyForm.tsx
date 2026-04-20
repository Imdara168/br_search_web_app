'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CompanyFormData } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

const companySchema = z.object({
  englishName: z.string()
    .min(1, 'English name is required')
    .min(2, 'English name must be at least 2 characters'),
  khmerName: z.string()
    .min(1, 'Khmer name is required')
    .min(2, 'Khmer name must be at least 2 characters'),
})

interface CompanyFormProps {
  initialData?: CompanyFormData
  onSubmit: (data: CompanyFormData) => void
  isLoading?: boolean
  submitButtonLabel?: string
  isDuplicate?: (englishName: string, currentName?: string) => boolean
}

export function CompanyForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonLabel = 'Create Entity',
  isDuplicate = () => false,
}: CompanyFormProps) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: initialData || {
      englishName: '',
      khmerName: '',
    },
  })

  const englishName = watch('englishName')

  const handleFormSubmit = (data: CompanyFormData) => {
    // Check for duplicates (case-insensitive, ignore spaces/commas/dots)
    const normalizedInput = data.englishName.toLowerCase().replace(/[\s,.]/g, '')
    const normalizedCurrent = initialData?.englishName.toLowerCase().replace(/[\s,.]/g, '') || ''

    if (normalizedInput === normalizedCurrent) {
      // Same entity, allow update
      onSubmit(data)
      return
    }

    if (isDuplicate(data.englishName, initialData?.englishName)) {
      toast({
        variant: 'destructive',
        title: 'Duplicate Entity',
        description: 'An entity with this name already exists',
      })
      return
    }

    onSubmit(data)
  }

  return (
    <Card className="bg-card border-border p-6 max-w-md">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            English Name
          </label>
          <Input
            {...register('englishName')}
            placeholder="Enter entity name in English"
            className="bg-secondary border-border text-foreground placeholder-muted-foreground"
            disabled={isLoading}
          />
          {errors.englishName && (
            <p className="text-destructive text-sm mt-1">
              {errors.englishName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Khmer Name
          </label>
          <Input
            {...register('khmerName')}
            placeholder="វាយបញ្ចូលឈ្មោះអង្គភាព"
            className="bg-secondary border-border text-foreground placeholder-muted-foreground"
            disabled={isLoading}
          />
          {errors.khmerName && (
            <p className="text-destructive text-sm mt-1">
              {errors.khmerName.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? 'Processing...' : submitButtonLabel}
          </Button>
        </div>
      </form>
    </Card>
  )
}
