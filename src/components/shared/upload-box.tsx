'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface UploadBoxProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSize?: number
  accept?: string
  className?: string
}

export function UploadBox({ 
  onFilesSelected, 
  maxFiles = 10, 
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = "image/*",
  className 
}: UploadBoxProps) {
  const [files, setFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }, [files, maxFiles, onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxFiles,
    maxSize,
  })

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary",
          "min-h-[200px] flex flex-col items-center justify-center"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <div className="text-sm text-gray-600">
          <p className="font-medium">
            {isDragActive ? 'Drop files here' : 'Drag & drop files or click to browse'}
          </p>
          <p className="text-xs mt-1">
            Supports JPG, PNG, WebP up to {maxSize / 1024 / 1024}MB
          </p>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <ImageIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
