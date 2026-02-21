'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

// Define supported file categories if needed, or remove if not used
export const FILE_CATEGORIES = {
  UPLOADS: 'uploads',
  RESULTS: 'results',
}

interface UploadBoxProps {
  onFilesSelected: (files: File[]) => void
  onFilesUploaded?: (uploadedFiles: Array<{ key: string; url: string; size: number; originalName: string }>) => void
  maxFiles?: number
  maxSize?: number
  accept?: string
  className?: string
  category?: string
  showUploadProgress?: boolean
}

export function UploadBox({ 
  onFilesSelected, 
  onFilesUploaded,
  maxFiles = 10, 
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = "image/*",
  className,
  category = FILE_CATEGORIES.UPLOADS,
  showUploadProgress = true
}: UploadBoxProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ key: string; url: string; size: number; originalName: string }>>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isValidFileType = (file: File, acceptedTypes: string[]) => {
    // Simple validation based on accept string (e.g. "image/*")
    if (acceptedTypes.some(type => type.endsWith('/*'))) {
      const mainType = acceptedTypes[0].split('/')[0]
      return file.type.startsWith(mainType + '/')
    }
    return acceptedTypes.includes(file.type)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null)
    // Validate files
    const validFiles = acceptedFiles.filter(file => {
      // Basic validation
      if (accept && !file.type.match(accept.replace('*', '.*'))) {
         console.warn(`Invalid file type: ${file.name}`)
         return false
      }
      if (file.size > maxSize) {
        console.warn(`File too large: ${file.name}`)
        return false
      }
      return true
    })

    if (validFiles.length === 0 && acceptedFiles.length > 0) {
      setError('No valid files selected. Please check file type and size.')
      return
    }

    const newFiles = [...files, ...validFiles].slice(0, maxFiles)
    setFiles(newFiles)
    onFilesSelected(newFiles)

    // Auto-upload if showUploadProgress is enabled
    if (showUploadProgress && validFiles.length > 0) {
      handleUpload(validFiles)
    }
  }, [files, maxFiles, onFilesSelected, accept, maxSize, showUploadProgress])

  const handleUpload = async (filesToUpload: File[]) => {
    setIsUploading(true)
    setError(null)
    const results: Array<{ key: string; url: string; size: number; originalName: string }> = []

    try {
      // Upload files sequentially or in parallel
      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/runninghub/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`)
        }

        const data = await response.json()
        if (data.success) {
          results.push({
            key: data.key,
            url: data.url,
            size: data.size,
            originalName: data.originalName
          })
        } else {
            console.error('Upload error:', data.error)
            throw new Error(data.error || 'Upload failed')
        }
      }

      setUploadedFiles(prev => [...prev, ...results])
      
      if (onFilesUploaded) {
        onFilesUploaded(results)
      }
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message || 'Failed to upload files')
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFilesSelected(newFiles)
  }

  const removeUploadedFile = async (key: string) => {
     // For now just remove from state, as we might not have a delete endpoint for RunningHub immediately available
     // or we rely on their cleanup policy.
     setUploadedFiles(prev => prev.filter(f => f.key !== key))
  }


  // Clear upload state when component unmounts
  useEffect(() => {
    return () => {
      // cleanup if needed
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? { [accept]: [] } : undefined,
    maxFiles,
    maxSize,
  })

  return (
    <div className={cn("w-full", className)}>
      {/* Upload Progress */}
      {showUploadProgress && isUploading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              Uploading files...
            </span>
            <span className="text-sm text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `100%` }}
            />
          </div>
          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="ml-2 h-6 px-2 text-xs"
              >
                Dismiss
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Drop Zone */}
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

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files ({files.length})</h4>
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
                    {formatFileSize(file.size)}
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

      {/* Uploaded Files */}
      {showUploadProgress && uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files ({uploadedFiles.length})</h4>
          {uploadedFiles.map((file) => (
            <div
              key={file.key}
              className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-800">{file.originalName}</p>
                  <p className="text-xs text-green-600">
                    {formatFileSize(file.size)}
                  </p>
                  <p className="text-xs text-green-500">
                    RunningHub: {file.key.substring(0, 20)}...
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUploadedFile(file.key)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Manual Upload Button */}
      {showUploadProgress && files.length > 0 && !isUploading && (
        <div className="mt-4">
          <Button
            onClick={() => handleUpload(files)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload to RunningHub
          </Button>
        </div>
      )}
    </div>
  )
}
