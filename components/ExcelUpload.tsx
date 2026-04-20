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

export function ExcelUpload({ onDataLoaded }: ExcelUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const { toast } = useToast()

  // Check if text contains Khmer characters
  const isKhmerText = (text: string): boolean => {
    if (!text) return false
    // Khmer Unicode range: U+1780-U+17FF and U+19E0-U+19FF
    const khmerRegex = /[\u1780-\u17FF\u19E0-\u19FF]/
    return khmerRegex.test(text)
  }

  // Detect if a column contains mostly Khmer or English text
  const detectColumnType = (columnData: string[]): 'english' | 'khmer' | 'unknown' => {
    // Sample up to 10 non-empty values
    const samples = columnData.filter((val) => val && val.trim()).slice(0, 10)
    
    if (samples.length === 0) return 'unknown'

    // Count Khmer vs non-Khmer texts
    const khmerCount = samples.filter((text) => isKhmerText(text)).length
    const englishCount = samples.length - khmerCount

    if (khmerCount > englishCount) return 'khmer'
    if (englishCount > khmerCount) return 'english'
    return 'unknown'
  }

  const parseExcelFile = (file: File) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[]

        if (jsonData.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No Data Found',
            description: 'The Excel file appears to be empty',
          })
          return
        }

        // Get all column headers
        const headers = Object.keys(jsonData[0])

        // Analyze each column to determine if it's Khmer or English
        const columnTypes: Record<string, 'english' | 'khmer' | 'unknown'> = {}

        headers.forEach((header) => {
          const columnData = jsonData.map((row) => String(row[header] || ''))
          columnTypes[header] = detectColumnType(columnData)
        })

        // Find the English and Khmer columns
        const englishColumn = headers.find((h) => columnTypes[h] === 'english')
        const khmerColumn = headers.find((h) => columnTypes[h] === 'khmer')

        if (!englishColumn || !khmerColumn) {
          toast({
            variant: 'destructive',
            title: 'Unable to Detect Columns',
            description:
              'Could not automatically detect English and Khmer columns. Make sure your Excel has at least one column with English text and one with Khmer text.',
          })
          return
        }

        // Map the data using detected columns
        const companies: CompanyFormData[] = jsonData
          .map((row) => ({
            englishName: String(row[englishColumn] || '').trim(),
            khmerName: String(row[khmerColumn] || '').trim(),
          }))
          .filter((company) => company.englishName && company.khmerName)

        if (companies.length === 0) {
          toast({
            variant: 'destructive',
            title: 'No Valid Data',
            description: 'No rows with both English and Khmer names found',
          })
          return
        }

        setFileName(file.name)
        onDataLoaded(companies)
        toast({
          title: 'Success',
          description: `Found ${companies.length} companies in the file`,
        })
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to parse Excel file. Please check the format.',
        })
      }
    }

    reader.readAsBinaryString(file)
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

    parseExcelFile(file)
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
            Upload an Excel file with English and Khmer company names. The system will automatically detect which column contains which language.
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
