"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { useTebi } from '@/lib/hooks/use-tebi'
import { tebiApi } from '@/lib/api/tebi'
import { tebiClient, FileCategory, FILE_CATEGORIES } from '@/lib/tebi'
import { Upload, Download, Trash2, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface FileItem {
  key: string
  url: string
  size: number
  originalName: string
  category: FileCategory
  uploadedAt: Date
}

export default function TebiDemoPage() {
  const { uploadState, uploadFile, uploadMultipleFiles, deleteFile, listFiles } = useTebi()
  const [files, setFiles] = useState<FileItem[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('upload')

  // Test connection on component mount
  useEffect(() => {
    testConnection()
    loadFiles()
  }, [])

  const testConnection = async () => {
    try {
      setConnectionStatus('checking')
      await tebiApi.listFiles('uploads')
      setConnectionStatus('connected')
      setError(null)
    } catch (err) {
      setConnectionStatus('error')
      setError(err instanceof Error ? err.message : 'Connection failed')
    }
  }

  const loadFiles = async () => {
    try {
      const uploadedFiles = await tebiApi.listFiles('uploads')
      // Map the API response to match our FileItem interface
      const mappedFiles = uploadedFiles.map(file => ({
        key: file.key,
        url: file.url,
        size: file.size,
        originalName: file.key.split('/').pop() || file.key, // Extract filename from key
        category: 'uploads' as FileCategory,
        uploadedAt: file.lastModified || new Date()
      }))
      setFiles(mappedFiles)
    } catch (err) {
      console.error('Failed to load files:', err)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setSelectedFiles(files)
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    try {
      setError(null)
      const uploadedFiles = await uploadMultipleFiles(selectedFiles, FILE_CATEGORIES.UPLOADS)
      setFiles(prev => [...prev, ...uploadedFiles])
      setSelectedFiles([])
      await loadFiles() // Refresh file list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleDelete = async (fileKey: string) => {
    try {
      await deleteFile(fileKey)
      await loadFiles() // Refresh file list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const ConnectionStatus = () => {
    const statusConfig = {
      checking: { icon: AlertCircle, color: 'text-yellow-500', text: 'Checking connection...' },
      connected: { icon: CheckCircle, color: 'text-green-500', text: 'Connected to Tebi.io' },
      error: { icon: XCircle, color: 'text-red-500', text: 'Connection failed' }
    }

    const { icon: Icon, color, text } = statusConfig[connectionStatus]

    return (
      <div className={`flex items-center gap-2 ${color}`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{text}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Tebi.io Integration Demo
            </h1>
            <p className="text-slate-300 text-lg mb-6">
              Test and explore Tebi.io cloud storage integration with file upload, management, and gallery features.
            </p>
            <div className="flex justify-center items-center gap-4">
              <ConnectionStatus />
              <Button 
                onClick={testConnection} 
                variant="outline" 
                size="sm"
                disabled={connectionStatus === 'checking'}
              >
                Test Connection
              </Button>
            </div>
          </div>

          {/* Connection Status Cards */}
          {connectionStatus === 'connected' && (
            <Card className="mb-6 p-4 border-green-500 bg-green-500/10">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-300" />
                <span className="font-medium text-green-300">Connected</span>
              </div>
              <p className="mt-2 text-sm text-green-300">
                Successfully connected to Tebi.io. You can now upload and manage files.
              </p>
            </Card>
          )}

          {connectionStatus === 'error' && (
            <Card className="mb-6 p-4 border-red-500 bg-red-500/10">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-300" />
                <span className="font-medium text-red-300">Connection Failed</span>
              </div>
              <p className="mt-2 text-sm text-red-300">
                Unable to connect to Tebi.io. Please check your configuration.
              </p>
            </Card>
          )}

          {/* Error Alert */}
          {error && (
            <Card className="mb-6 p-4 border-red-500 bg-red-500/10">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-300" />
                <span className="font-medium text-red-300">Error</span>
              </div>
              <p className="mt-2 text-sm text-red-300">{error}</p>
            </Card>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
              <TabsTrigger value="upload" className="data-[state=active]:bg-purple-600">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files
              </TabsTrigger>
              <TabsTrigger value="manage" className="data-[state=active]:bg-purple-600">
                <Eye className="h-4 w-4 mr-2" />
                File Manager
              </TabsTrigger>
              <TabsTrigger value="gallery" className="data-[state=active]:bg-purple-600">
                <Download className="h-4 w-4 mr-2" />
                Gallery
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    File Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer flex flex-col items-center gap-4"
                    >
                      <Upload className="h-12 w-12 text-slate-400" />
                      <div>
                        <p className="text-white font-medium">Click to select files</p>
                        <p className="text-slate-400 text-sm">or drag and drop files here</p>
                      </div>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-white font-medium">Selected Files:</h4>
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-slate-700 p-3 rounded">
                          <span className="text-white">{file.name}</span>
                          <Badge variant="secondary">{formatFileSize(file.size)}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadState.isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-white">Uploading...</span>
                        <span className="text-slate-300">{uploadState.progress}%</span>
                      </div>
                      <Progress value={uploadState.progress} className="w-full" />
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || uploadState.isUploading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {uploadState.isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* File Manager Tab */}
            <TabsContent value="manage" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      File Manager
                    </div>
                    <Badge variant="secondary">{files.length} files</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {files.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No files uploaded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {files.map((file) => (
                        <div key={file.key} className="flex items-center justify-between bg-slate-700 p-4 rounded">
                          <div className="flex-1">
                            <p className="text-white font-medium">{file.originalName}</p>
                            <p className="text-slate-400 text-sm">
                              {formatFileSize(file.size)} • {file.category} • {file.uploadedAt.toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(file.url, '_blank')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(file.key)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Image Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {files.filter(file => file.originalName.match(/\.(jpg|jpeg|png|gif|webp)$/i)).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No images uploaded yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {files
                        .filter(file => file.originalName.match(/\.(jpg|jpeg|png|gif|webp)$/i))
                        .map((file) => (
                          <div key={file.key} className="bg-slate-700 rounded-lg overflow-hidden">
                            <img
                              src={file.url}
                              alt={file.originalName}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-image.svg'
                              }}
                            />
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="text-white text-sm font-medium truncate">{file.originalName}</p>
                                  <p className="text-slate-400 text-xs">{formatFileSize(file.size)}</p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDelete(file.key)}
                                  className="text-red-400 hover:text-red-300 ml-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Powered by <span className="text-purple-400 font-medium">Tebi.io</span> - 
              AWS S3 Compatible Cloud Storage
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}