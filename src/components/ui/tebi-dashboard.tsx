'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Copy, 
  Move, 
  Eye, 
  Cloud,
  FileImage,
  FileText,
  FileArchive,
  Folder,
  RefreshCw,
  Upload,
  Settings
} from 'lucide-react'
import { useTebi } from '@/lib/hooks/use-tebi'
import { FILE_CATEGORIES, FileCategory } from '@/lib/tebi'

interface FileItem {
  key: string
  url: string
  size: number
  originalName: string
  category: FileCategory
  uploadedAt: Date
  metadata?: Record<string, string>
}

export function TebiDashboard() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>(FILE_CATEGORIES.UPLOADS)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const {
    listFiles,
    deleteFile,
    copyFile,
    moveFile,
    getFileMetadata,
    getPresignedAccessUrl,
    formatFileSize,
    cleanupTempFiles
  } = useTebi()

  // Load files on component mount
  useEffect(() => {
    loadFiles()
  }, [selectedCategory])

  // Filter files based on search term
  useEffect(() => {
    const filtered = files.filter(file => 
      file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.key.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredFiles(filtered)
  }, [files, searchTerm])

  const loadFiles = async () => {
    setIsLoading(true)
    try {
      const fileList = await listFiles(selectedCategory)
      const filesWithMetadata: FileItem[] = []
      
      for (const file of fileList) {
        const metadata = await getFileMetadata(file.key)
        filesWithMetadata.push({
          ...file,
          metadata
        })
      }
      
      setFiles(filesWithMetadata)
    } catch (error) {
      console.error('Failed to load files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (key: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedFiles(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.key)))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) return
    
    if (confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`)) {
      for (const key of selectedFiles) {
        try {
          await deleteFile(key)
        } catch (error) {
          console.error(`Failed to delete ${key}:`, error)
        }
      }
      setSelectedFiles(new Set())
      loadFiles()
    }
  }

  const handleCopySelected = async (destinationCategory: FileCategory) => {
    if (selectedFiles.size === 0) return
    
    for (const key of selectedFiles) {
      try {
        const fileName = key.split('/').pop() || 'unknown'
        const newKey = `${destinationCategory}/${Date.now()}-${fileName}`
        await copyFile(key, newKey)
      } catch (error) {
        console.error(`Failed to copy ${key}:`, error)
      }
    }
    setSelectedFiles(new Set())
    loadFiles()
  }

  const handleMoveSelected = async (destinationCategory: FileCategory) => {
    if (selectedFiles.size === 0) return
    
    for (const key of selectedFiles) {
      try {
        const fileName = key.split('/').pop() || 'unknown'
        const newKey = `${destinationCategory}/${Date.now()}-${fileName}`
        await moveFile(key, newKey)
      } catch (error) {
        console.error(`Failed to move ${key}:`, error)
      }
    }
    setSelectedFiles(new Set())
    loadFiles()
  }

  const handleDownload = async (file: FileItem) => {
    try {
      const downloadUrl = await getPresignedAccessUrl(file.key, 3600)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.originalName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to generate download URL:', error)
    }
  }

  const handleCleanup = async () => {
    if (confirm('Clean up temporary files older than 24 hours?')) {
      try {
        const deletedCount = await cleanupTempFiles(24)
        alert(`Cleaned up ${deletedCount} temporary files`)
        loadFiles()
      } catch (error) {
        console.error('Failed to cleanup:', error)
      }
    }
  }

  const getFileIcon = (file: FileItem) => {
    if (file.metadata?.category === FILE_CATEGORIES.THUMBNAILS) {
      return <FileImage className="w-8 h-8 text-blue-500" />
    }
    if (file.key.endsWith('.json')) {
      return <FileText className="w-8 h-8 text-green-500" />
    }
    if (file.key.endsWith('.zip') || file.key.endsWith('.rar')) {
      return <FileArchive className="w-8 h-8 text-orange-500" />
    }
    return <FileImage className="w-8 h-8 text-purple-500" />
  }

  const getCategoryColor = (category: FileCategory) => {
    const colors: Record<FileCategory, string> = {
      [FILE_CATEGORIES.UPLOADS]: 'bg-blue-100 text-blue-800',
      [FILE_CATEGORIES.ENHANCED]: 'bg-green-100 text-green-800',
      [FILE_CATEGORIES.THUMBNAILS]: 'bg-purple-100 text-purple-800',
      [FILE_CATEGORIES.TEMP]: 'bg-yellow-100 text-yellow-800',
      [FILE_CATEGORIES.ASSETS]: 'bg-gray-100 text-gray-800',
      [FILE_CATEGORIES.USER_AVATARS]: 'bg-pink-100 text-pink-800',
      [FILE_CATEGORIES.GALLERY]: 'bg-indigo-100 text-indigo-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tebi.io File Manager</h2>
          <p className="text-gray-600">Manage all your files stored in Tebi.io cloud storage</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={loadFiles} disabled={isLoading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCleanup} variant="outline">
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as FileCategory)}>
        <TabsList className="grid w-full grid-cols-7">
          {Object.values(FILE_CATEGORIES).map((category) => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.values(FILE_CATEGORIES).map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {/* Bulk Actions */}
            {selectedFiles.size > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedFiles.size} file(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopySelected(FILE_CATEGORIES.ASSETS)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy to Assets
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMoveSelected(FILE_CATEGORIES.ASSETS)}
                      >
                        <Move className="w-4 h-4 mr-2" />
                        Move to Assets
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files Grid/List */}
            {isLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-600 mt-2">Loading files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Cloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                  <p className="text-gray-600">No files in the {category} category</p>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                {filteredFiles.map((file) => (
                  <Card key={file.key} className={viewMode === 'grid' ? '' : 'flex items-center'}>
                    <CardContent className={viewMode === 'grid' ? 'p-4' : 'p-4 flex-1'}>
                      <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center space-x-4'}>
                        {/* File Icon */}
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.key)}
                            onChange={() => handleFileSelect(file.key)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          {getFileIcon(file)}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{file.originalName}</h4>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getCategoryColor(file.category)}>
                              {file.category}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatFileSize(file.size)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {file.key}
                          </p>
                          <p className="text-xs text-gray-400">
                            {file.uploadedAt.toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFileSelect(file.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Select All */}
            {filteredFiles.length > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedFiles.size === filteredFiles.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Select all {filteredFiles.length} files
                </span>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
