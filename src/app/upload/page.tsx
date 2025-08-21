'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  Image, 
  Link as LinkIcon, 
  Sparkles, 
  Zap, 
  Clock, 
  Eye, 
  Download,
  X,
  CheckCircle,
  AlertCircle,
  Menu
} from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  result?: string
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [processingMode, setProcessingMode] = useState<'quick' | 'full'>('quick')
  const [preserveIdentity, setPreserveIdentity] = useState(true)
  const [urlInput, setUrlInput] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])

    // Simulate upload progress
    newFiles.forEach(file => {
      simulateUpload(file.id)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  })

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          if (file.progress < 100) {
            return { ...file, progress: file.progress + 10 }
          } else {
            clearInterval(interval)
            return { ...file, status: 'processing' }
          }
        }
        return file
      }))
    }, 200)

    // Simulate processing completion
    setTimeout(() => {
      setUploadedFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          return { 
            ...file, 
            status: 'completed',
            result: file.preview // In real app, this would be the enhanced image
          }
        }
        return file
      }))
    }, 3000)
  }

  const handleUrlUpload = () => {
    if (!urlInput.trim()) return

    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      file: new File([], 'url-image.jpg'),
      preview: urlInput,
      status: 'uploading',
      progress: 0
    }

    setUploadedFiles(prev => [...prev, newFile])
    setUrlInput('')
    simulateUpload(newFile.id)
  }

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId))
  }

  const processAll = () => {
    setUploadedFiles(prev => prev.map(file => ({
      ...file,
      status: 'processing'
    })))

    // Simulate processing all files
    setTimeout(() => {
      setUploadedFiles(prev => prev.map(file => ({
        ...file,
        status: 'completed',
        result: file.preview
      })))
    }, 2000)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading': return <Clock className="w-4 h-4 text-blue-500" />
      case 'processing': return <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-xl border-b border-slate-200/50 z-50">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Sharpii.ai
            </span>
          </Link>
          
          <div className="hidden lg:flex items-center space-x-6">
            <Link href="/upload" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Upload</Link>
            <Link href="/gallery" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Gallery</Link>
            <Link href="/editor" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Editor</Link>
            <Link href="/jobs" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Jobs</Link>
          </div>
          
          <div className="hidden lg:flex items-center space-x-3">
            <Link href="/auth/signin">
              <Button variant="ghost" size="sm" className="font-medium text-sm">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg font-medium">
                Get Started Free
              </Button>
            </Link>
          </div>
          
          <button 
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 py-4 px-6">
            <div className="flex flex-col space-y-3">
              <Link href="/upload" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Upload</Link>
              <Link href="/gallery" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Gallery</Link>
              <Link href="/editor" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Editor</Link>
              <Link href="/jobs" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Jobs</Link>
              <div className="border-t border-slate-200 pt-3 mt-3">
                <Link href="/auth/signin" className="block mb-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start font-medium text-sm">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg font-medium">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="container mx-auto px-6 py-8 pt-24">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Enhance Your Images
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Upload images and let our AI transform them with professional-grade enhancement and upscaling.
            </p>
          </div>

          {/* Processing Mode Selection */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Zap className="w-5 h-5 text-blue-600" />
                <span>Processing Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    processingMode === 'quick' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setProcessingMode('quick')}
                >
                  <div className="flex items-center space-x-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Quick Preview</h3>
                      <p className="text-xs text-slate-600">Low-latency enhancement for instant results</p>
                    </div>
                  </div>
                </div>
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    processingMode === 'full' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => setProcessingMode('full')}
                >
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm">Full Quality</h3>
                      <p className="text-xs text-slate-600">High-quality processing with advanced models</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Methods */}
          <Tabs defaultValue="drag-drop" className="mb-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="drag-drop">Drag & Drop</TabsTrigger>
              <TabsTrigger value="browse">Browse Files</TabsTrigger>
              <TabsTrigger value="url">URL Import</TabsTrigger>
            </TabsList>

            <TabsContent value="drag-drop">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                      isDragActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {isDragActive ? 'Drop your images here' : 'Drag & drop images here'}
                    </h3>
                    <p className="text-slate-600 mb-3 text-sm">
                      or click to browse files
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports JPG, PNG, GIF, WebP up to 50MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="browse">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="text-center">
                    <Button 
                      size="lg" 
                      onClick={() => document.getElementById('file-input')?.click()}
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 rounded-xl font-medium"
                    >
                      <Image className="w-4 h-4 mr-2" />
                      Choose Files
                    </Button>
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || [])
                        onDrop(files)
                      }}
                    />
                    <p className="text-xs text-slate-500 mt-3">
                      Select multiple images to process in batch
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="url">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex space-x-3">
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <Button 
                      onClick={handleUrlUpload}
                      disabled={!urlInput.trim()}
                      className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 rounded-lg font-medium"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Import images directly from URLs
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Advanced Options */}
          <Card className="mb-6 border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Advanced Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preserveIdentity}
                      onChange={(e) => setPreserveIdentity(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-900 text-sm font-medium">Preserve Identity (Face Detection)</span>
                  </label>
                  <p className="text-xs text-slate-600 mt-1 ml-7">
                    Automatically detect and preserve facial features during enhancement
                  </p>
                </div>
                <div>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-slate-900 text-sm font-medium">Tileable Output</span>
                  </label>
                  <p className="text-xs text-slate-600 mt-1 ml-7">
                    Generate seamless textures for tiling applications
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Uploaded Files ({uploadedFiles.length})</CardTitle>
                  <Button 
                    onClick={processAll}
                    disabled={uploadedFiles.some(f => f.status === 'processing')}
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 rounded-lg font-medium"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Process All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center space-x-4 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden">
                        <img 
                          src={file.preview} 
                          alt={`Preview of ${file.file.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-slate-900 text-sm">{file.file.name}</span>
                          <Badge className={getStatusColor(file.status)}>
                            {getStatusIcon(file.status)}
                            <span className="ml-1 text-xs">{file.status}</span>
                          </Badge>
                        </div>
                        {file.status === 'uploading' && (
                          <Progress value={file.progress} className="h-1.5" />
                        )}
                        {file.error && (
                          <p className="text-xs text-red-600">{file.error}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.status === 'completed' && (
                          <Button size="sm" variant="outline" className="text-xs">
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => removeFile(file.id)}
                          className="p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          {uploadedFiles.some(f => f.status === 'completed') && (
            <Card className="text-center border-0 shadow-lg">
              <CardContent className="p-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  Images Processed Successfully!
                </h3>
                <p className="text-slate-600 mb-5 text-sm">
                  Your enhanced images are ready. View them in your gallery or continue processing more images.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/gallery">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 rounded-lg font-medium">
                      <Eye className="w-4 h-4 mr-2" />
                      View Gallery
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => setUploadedFiles([])}
                    className="rounded-lg font-medium"
                  >
                    Process More Images
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
