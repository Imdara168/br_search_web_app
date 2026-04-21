'use client'

import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CompanyFormData } from '@/lib/types'

interface ExcelUploadProps {
  onDataLoaded: (companies: CompanyFormData[]) => void
}

type ColumnRole = 'english' | 'khmer' | 'entityCode'

const MAX_SAMPLE_ROWS = 200
const MAX_SAMPLE_VALUES = 50
const MAX_IMPORT_ROWS = 100000

export function ExcelUpload({ onDataLoaded }: ExcelUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const { toast } = useToast()

  const isKhmerText = (text: string): boolean => {
    if (!text) return false
    return /[\u1780-\u17FF\u19E0-\u19FF]/.test(text)
  }

  const normalizeCellValue = (value: unknown) => String(value ?? '').trim()

  const normalizeEntityCode = (value: string) => value.replace(/\s+/g, '').toUpperCase()

  const isEntityCodeText = (text: string): boolean => {
    if (!text) return false
    return /^\d+(?:\/[A-Za-z0-9-]+)+$/i.test(normalizeEntityCode(text))
  }

  const isEnglishLikeText = (text: string): boolean => {
    if (!text || isKhmerText(text) || isEntityCodeText(text)) {
      return false
    }

    return /[A-Za-z]/.test(text)
  }

  const detectHeaderRole = (text: string): ColumnRole | null => {
    const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '')

    if (!normalized) {
      return null
    }

    if (normalized.includes('english')) {
      return 'english'
    }

    if (normalized.includes('khmer')) {
      return 'khmer'
    }

    if (
      normalized.includes('entitycode') ||
      normalized.includes('entitiescode') ||
      normalized.includes('registrationcode') ||
      normalized === 'code'
    ) {
      return 'entityCode'
    }

    return null
  }

  const detectColumnIndices = (rows: string[][]) => {
    const sampleRows = rows.slice(0, MAX_SAMPLE_ROWS)
    const columnCount = sampleRows.reduce((max, row) => Math.max(max, row.length), 0)

    if (columnCount === 0) {
      return null
    }

    const headerRow = sampleRows[0] || []
    const headerMatches = new Map<ColumnRole, number>()

    headerRow.forEach((value, index) => {
      const role = detectHeaderRole(value)
      if (role && !headerMatches.has(role)) {
        headerMatches.set(role, index)
      }
    })

    const samplesByColumn = Array.from({ length: columnCount }, () => [] as string[])

    sampleRows.forEach((row) => {
      for (let columnIndex = 0; columnIndex < columnCount; columnIndex += 1) {
        const value = normalizeCellValue(row[columnIndex])
        if (value && samplesByColumn[columnIndex].length < MAX_SAMPLE_VALUES) {
          samplesByColumn[columnIndex].push(value)
        }
      }
    })

    const usedColumns = new Set<number>()
    const resolved: Partial<Record<ColumnRole, number>> = {}

    const scoreColumn = (role: ColumnRole, values: string[]) => {
      const nonEmptyValues = values.filter(Boolean)
      if (nonEmptyValues.length === 0) {
        return -1
      }

      const matchingCount = nonEmptyValues.filter((value) => {
        if (role === 'khmer') return isKhmerText(value)
        if (role === 'entityCode') return isEntityCodeText(value)
        return isEnglishLikeText(value)
      }).length

      const ratio = matchingCount / nonEmptyValues.length
      return ratio * 1000 + matchingCount
    }

    ;(['english', 'khmer', 'entityCode'] as ColumnRole[]).forEach((role) => {
      const headerIndex = headerMatches.get(role)
      if (headerIndex !== undefined) {
        resolved[role] = headerIndex
        usedColumns.add(headerIndex)
        return
      }

      let bestColumn = -1
      let bestScore = -1

      samplesByColumn.forEach((values, index) => {
        if (usedColumns.has(index)) {
          return
        }

        const score = scoreColumn(role, values)
        if (score > bestScore) {
          bestScore = score
          bestColumn = index
        }
      })

      if (bestColumn >= 0) {
        resolved[role] = bestColumn
        usedColumns.add(bestColumn)
      }
    })

    if (
      resolved.english === undefined ||
      resolved.khmer === undefined ||
      resolved.entityCode === undefined
    ) {
      return null
    }

    return {
      english: resolved.english,
      khmer: resolved.khmer,
      entityCode: resolved.entityCode,
      hasHeaderRow:
        detectHeaderRole(headerRow[resolved.english] || '') === 'english' &&
        detectHeaderRole(headerRow[resolved.khmer] || '') === 'khmer' &&
        detectHeaderRole(headerRow[resolved.entityCode] || '') === 'entityCode',
    }
  }

  const parseRows = (rows: string[][]): CompanyFormData[] => {
    const detectedColumns = detectColumnIndices(rows)

    if (!detectedColumns) {
      return []
    }

    return rows
      .map((row, rowIndex) => {
        if (detectedColumns.hasHeaderRow && rowIndex === 0) {
          return null
        }

        const values = row.map((value) => normalizeCellValue(value)).filter(Boolean)

        if (values.length === 0) {
          return null
        }

        let englishName = normalizeCellValue(row[detectedColumns.english])
        let khmerName = normalizeCellValue(row[detectedColumns.khmer])
        let entityCode = normalizeCellValue(row[detectedColumns.entityCode])

        if (!englishName) {
          englishName = values.find((value) => isEnglishLikeText(value)) || ''
        }

        if (!khmerName) {
          khmerName = values.find((value) => isKhmerText(value)) || ''
        }

        if (!entityCode) {
          entityCode = values.find((value) => isEntityCodeText(value)) || ''
        }

        const normalizedEntityCode = normalizeEntityCode(entityCode)
        const isHeaderRow =
          detectHeaderRole(englishName) === 'english' &&
          detectHeaderRole(khmerName) === 'khmer' &&
          detectHeaderRole(normalizedEntityCode) === 'entityCode'

        if (isHeaderRow || !englishName || !khmerName || !normalizedEntityCode) {
          return null
        }

        return {
          englishName,
          khmerName,
          entityCode: normalizedEntityCode,
        }
      })
      .filter((company): company is CompanyFormData => company !== null)
  }

  const parseExcelFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet, {
        header: 1,
        raw: false,
        defval: '',
        blankrows: false,
      })

      const rows = rawRows.map((row) => row.map((cell) => normalizeCellValue(cell)))

      if (rows.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Data Found',
          description: 'The Excel file appears to be empty.',
        })
        return
      }

      const companies = parseRows(rows)

      if (companies.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Unable to Detect Columns',
          description:
            'Could not detect English Name, Khmer Name, and Entities Code columns. Make sure the sheet has those 3 values in each row.',
        })
        return
      }

      if (companies.length > MAX_IMPORT_ROWS) {
        toast({
          variant: 'destructive',
          title: 'Import Limit Exceeded',
          description: `You can import up to ${MAX_IMPORT_ROWS} rows at a time.`,
        })
        return
      }

      setFileName(file.name)
      onDataLoaded(companies)
      toast({
        title: 'Success',
        description: `Found ${companies.length} entities in the file`,
      })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to parse Excel file. Please check the format.',
      })
    }
  }

  const handleFileSelect = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast({
        variant: 'destructive',
        title: 'Invalid File',
        description: 'Please select an Excel file (.xlsx, .xls) or CSV file',
      })
      return
    }

    void parseExcelFile(file)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClear = () => {
    setFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onDataLoaded([])
  }

  return (
    <Card className="bg-card border-border p-6 mb-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Import from Excel
          </h3>
          <p className="text-sm text-muted-foreground">
            Upload an Excel or CSV file with 3 columns for English Name, Khmer Name, and Entities Code. The system will detect the columns automatically and preview them before import.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            For more than 65,536 rows, use `.xlsx` or `.csv`. Old `.xls` files cannot store 100,000+ rows.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Maximum import size: 100,000 rows per file.
          </p>
        </div>

        {!fileName ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleInputChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-foreground font-medium">
                  Drop your Excel file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground">File loaded successfully</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
