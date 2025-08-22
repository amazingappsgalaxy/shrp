'use client'

import React, { useState, useCallback, useEffect } from 'react'
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
  Menu,
  Cloud
} from 'lucide-react'
import Link from 'next/link'
import { useTebi } from '@/lib/hooks/use-tebi'
import { FILE_CATEGORIES } from '@/lib/tebi'
import { tebiApi } from '@/lib/api/tebi'

interface UploadedFile {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  result?: string
  tebiKey?: string
  tebiUrl?: string
}

// React Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Something went wrong</h1>
            <p className="text-red-600 mb-4">The upload page encountered an error.</p>
            <div className="bg-red-100 p-4 rounded text-left text-sm font-mono">
              <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
            </div>
            <Button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function UploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [processingMode, setProcessingMode] = useState<'quick' | 'full'>('quick')
  const [preserveIdentity, setPreserveIdentity] = useState(true)
  const [urlInput, setUrlInput] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [lastError, setLastError] = useState<string>('')

  const {
    uploadState,
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    formatFileSize,
    isValidFileType
  } = useTebi()

  // Add error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error)
      const errorMessage = event.error?.message || event.message || 'Unknown error'
      setLastError(`Global Error: ${errorMessage}`)
      setDebugInfo(prev => prev + `\nGlobal Error: ${errorMessage}`)
      
      // Log additional error details
      if (event.error) {
        console.error('Error details:', {
          name: event.error.name,
          message: event.error.message,
          stack: event.error.stack,
          cause: event.error.cause
        })
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      const errorMessage = event.reason?.message || event.reason || 'Unknown promise rejection'
      setLastError(`Promise Rejection: ${errorMessage}`)
      setDebugInfo(prev => prev + `\nPromise Rejection: ${errorMessage}`)
      
      // Log additional rejection details
      console.error('Rejection details:', {
        reason: event.reason,
        type: typeof event.reason,
        message: event.reason?.message,
        stack: event.reason?.stack
      })
    }

    // Add console error interceptor
    const originalConsoleError = console.error
    console.error = (...args) => {
      originalConsoleError.apply(console, args)
      
      // Check if it's a Tebi.io related error
      const errorString = args.join(' ')
      if (errorString.includes('tebi') || errorString.includes('Tebi') || errorString.includes('upload')) {
        setDebugInfo(prev => prev + `\nConsole Error: ${errorString}`)
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.error = originalConsoleError
    }
  }, [])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    console.log('Files dropped:', acceptedFiles)
    setDebugInfo(`Files dropped: ${acceptedFiles.length} files`)
    setLastError('')
    
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading',
      progress: 0
    }))

    setUploadedFiles(prev => [...prev, ...newFiles])
    setDebugInfo(prev => prev + `\nFiles added to state: ${newFiles.length}`)

    // Upload files to Tebi.io
    for (const fileInfo of newFiles) {
      try {
        console.log('Starting upload for file:', fileInfo.file.name)
        setDebugInfo(prev => prev + `\nStarting upload: ${fileInfo.file.name}`)
        
        const result = await uploadFile(
          fileInfo.file, 
          FILE_CATEGORIES.UPLOADS,
          { 
            processingMode,
            preserveIdentity: preserveIdentity.toString(),
            originalId: fileInfo.id
          }
        )
        
        console.log('Upload result:', result)
        setDebugInfo(prev => prev + `\nUpload result: ${JSON.stringify(result)}`)
        
        if (result) {
          setUploadedFiles(prev => prev.map(f => 
            f.id === fileInfo.id 
              ? { 
                  ...f, 
                  status: 'processing',
                  tebiKey: result.key,
                  tebiUrl: result.url
                }
              : f
          ))
          
          // Simulate processing completion
          setTimeout(() => {
            setUploadedFiles(prev => prev.map(f => 
              f.id === fileInfo.id 
                ? { 
                    ...f, 
                    status: 'completed',
                    result: result.url
                  }
                : f
            ))
            setDebugInfo(prev => prev + `\nFile completed: ${fileInfo.file.name}`)
          }, 2000)
        }
      } catch (error) {
        console.error('Upload error:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        setLastError(errorMessage)
        setDebugInfo(prev => prev + `\nUpload error: ${errorMessage}`)
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === fileInfo.id 
            ? { 
                ...f, 
                status: 'error',
                error: errorMessage
              }
            : f
        ))
      }
    }
  }, [uploadFile, processingMode, preserveIdentity])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true
  })

  const handleUrlUpload = async () => {
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
    
    // For URL imports, we'll just mark as completed since we can't upload external URLs
    setTimeout(() => {
      setUploadedFiles(prev => prev.map(f => 
        f.id === newFile.id 
          ? { ...f, status: 'completed', result: urlInput }
          : f
      ))
    }, 1000)
  }

  const removeFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId)
    
    // Delete from Tebi.io if it was uploaded
    if (file?.tebiKey) {
      try {
        await deleteFile(file.tebiKey)
      } catch (error) {
        console.error('Failed to delete from Tebi.io:', error)
      }
    }
    
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
        result: file.tebiUrl || file.preview
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

  // Test upload function
  const testUpload = async () => {
    console.log('Test upload clicked')
    setDebugInfo('Test upload clicked')
    setLastError('')
    
    try {
      // Test basic Tebi.io connection first
      console.log('Testing Tebi.io connection...')
      setDebugInfo(prev => prev + '\nTesting Tebi.io connection...')
      
      // Test if tebiApi is available
      if (typeof window !== 'undefined') {
        // @ts-ignore - Access global for testing
        window.tebiApi = tebiApi
        console.log('tebiApi available:', tebiApi)
        setDebugInfo(prev => prev + '\ntebiApi available: ' + (tebiApi ? 'yes' : 'no'))
      }
      
      // Create a test file
      const testContent = 'This is a test file for Tebi.io upload'
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
      
      console.log('Test file created:', testFile)
      setDebugInfo(prev => prev + `\nTest file created: ${testFile.name}`)
      
      const result = await uploadFile(testFile, FILE_CATEGORIES.UPLOADS, { test: 'true' })
      
      console.log('Test upload result:', result)
      setDebugInfo(prev => prev + `\nTest upload successful: ${JSON.stringify(result)}`)
      
      // Add to uploaded files
      const testUploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file: testFile,
        preview: 'Test file uploaded',
        status: 'completed',
        progress: 100,
        result: result?.url,
        tebiKey: result?.key,
        tebiUrl: result?.url
      }
      
      setUploadedFiles(prev => [...prev, testUploadedFile])
      
    } catch (error) {
      console.error('Test upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setLastError(errorMessage)
      setDebugInfo(prev => prev + `\nTest upload failed: ${errorMessage}`)
    }
  }

  // Simple test function
  const simpleTest = async () => {
    try {
      setDebugInfo('Running simple test...')
      setLastError('')
      
      // Test 1: Check if useTebi hook is working
      setDebugInfo(prev => prev + '\n✓ useTebi hook loaded')
      
      // Test 2: Check if tebiApi is available
      if (tebiApi) {
        setDebugInfo(prev => prev + '\n✓ tebiApi available')
        console.log('tebiApi object:', tebiApi)
      } else {
        setDebugInfo(prev => prev + '\n✗ tebiApi not available')
        throw new Error('tebiApi is undefined')
      }
      
      // Test 3: Check if uploadFile function exists
      if (typeof uploadFile === 'function') {
        setDebugInfo(prev => prev + '\n✓ uploadFile function available')
        console.log('uploadFile function:', uploadFile)
      } else {
        setDebugInfo(prev => prev + '\n✗ uploadFile function not available')
        throw new Error('uploadFile function is not available')
      }
      
      // Test 4: Check environment variables
      const envCheck = {
        endpoint: process.env.NEXT_PUBLIC_TEBI_ENDPOINT,
        region: process.env.NEXT_PUBLIC_TEBI_REGION,
        bucket: process.env.TEBI_BUCKET_NAME,
        hasAccessKey: !!process.env.TEBI_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.TEBI_SECRET_ACCESS_KEY
      }
      
      setDebugInfo(prev => prev + `\nEnvironment check: ${JSON.stringify(envCheck, null, 2)}`)
      
      // Test 5: Check Tebi.io configuration
      try {
        const { tebiConfig } = await import('@/lib/tebi')
        setDebugInfo(prev => prev + `\nTebi config: ${JSON.stringify(tebiConfig, null, 2)}`)
      } catch (configError) {
        setDebugInfo(prev => prev + `\nConfig import error: ${configError}`)
      }
      
      // Test 6: Try to access Tebi.io client
      try {
        const { tebiClient } = await import('@/lib/tebi')
        if (tebiClient) {
          setDebugInfo(prev => prev + '\n✓ tebiClient available')
        } else {
          setDebugInfo(prev => prev + '\n✗ tebiClient not available')
        }
      } catch (clientError) {
        setDebugInfo(prev => prev + `\nClient import error: ${clientError}`)
      }
      
      setDebugInfo(prev => prev + '\n✓ Simple test completed successfully!')
      
    } catch (error) {
      console.error('Simple test failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setLastError(errorMessage)
      setDebugInfo(prev => prev + `\n✗ Simple test failed: ${errorMessage}`)
      
      // Log the full error for debugging
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause
        })
      }
    }
  }

  return (
    <ErrorBoundary>
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
                <Button size="lg" className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 rounded-lg font-medium">
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
                    <Button size="lg" className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg font-medium">
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
                Upload images to Tebi.io and let our AI transform them with professional-grade enhancement and upscaling.
              </p>
              
              {/* Tebi.io Status */}
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
                <Cloud className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Powered by Tebi.io</span>
              </div>
            </div>

            {/* Error Display */}
            {lastError && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 text-sm">Last Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-red-700 text-sm font-mono bg-red-100 p-2 rounded">
                    {lastError}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setLastError('')}
                    className="mt-2"
                  >
                    Clear Error
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <Card className="mb-6 border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm text-gray-600">Debug Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {debugInfo}
                  </pre>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setDebugInfo('')}
                    className="mt-2"
                  >
                    Clear Debug
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Test Buttons */}
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Tebi.io Integration Tests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={simpleTest}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Cloud className="w-4 h-4 mr-2" />
                    Simple Test
                  </Button>
                  
                  <Button 
                    onClick={testUpload}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Test Upload
                  </Button>
                  
                  <Link href="/tebi-test">
                    <Button variant="outline">
                      <Eye className="w-4 h-4 mr-2" />
                      Advanced Test Page
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Use these buttons to test different aspects of the Tebi.io integration.
                </p>
              </CardContent>
            </Card>

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
                        <h3 className="text-lg font-semibold text-slate-900 text-sm">Full Quality</h3>
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
                          console.log('Files selected via browse:', files)
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
                            <Progress value={uploadState.progress} className="h-1.5" />
                          )}
                          {file.error && (
                            <p className="text-xs text-red-600">{file.error}</p>
                          )}
                          {file.tebiKey && (
                            <p className="text-xs text-blue-600">
                              Tebi.io: {file.tebiKey}
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.file.size)}
                          </p>
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
    </ErrorBoundary>
  )
}
