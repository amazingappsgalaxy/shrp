'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause, 
  Play,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  MoreHorizontal,
  Sparkles,
  Zap,
  Calendar,
  FileImage,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'

interface Job {
  id: string
  name: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused'
  progress: number
  imagesCount: number
  processedCount: number
  preset: string
  priority: 'low' | 'normal' | 'high'
  createdAt: string
  estimatedCompletion: string
  processingTime: number
  error?: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Mock data - in real app this would come from API
    const mockJobs: Job[] = [
      {
        id: '1',
        name: 'Portrait Enhancement Batch',
        status: 'processing',
        progress: 65,
        imagesCount: 20,
        processedCount: 13,
        preset: 'Portrait',
        priority: 'high',
        createdAt: '2024-01-15T10:30:00Z',
        estimatedCompletion: '2024-01-15T11:15:00Z',
        processingTime: 25
      },
      {
        id: '2',
        name: 'Landscape Restoration',
        status: 'completed',
        progress: 100,
        imagesCount: 5,
        processedCount: 5,
        preset: 'Landscape',
        priority: 'normal',
        createdAt: '2024-01-15T09:00:00Z',
        estimatedCompletion: '2024-01-15T09:45:00Z',
        processingTime: 45
      },
      {
        id: '3',
        name: 'Product Photography',
        status: 'queued',
        progress: 0,
        imagesCount: 15,
        processedCount: 0,
        preset: 'Product',
        priority: 'normal',
        createdAt: '2024-01-15T11:00:00Z',
        estimatedCompletion: '2024-01-15T12:30:00Z',
        processingTime: 0
      },
      {
        id: '4',
        name: 'Artistic Enhancement',
        status: 'failed',
        progress: 30,
        imagesCount: 8,
        processedCount: 2,
        preset: 'Artistic',
        priority: 'low',
        createdAt: '2024-01-15T08:30:00Z',
        estimatedCompletion: '2024-01-15T09:15:00Z',
        processingTime: 15,
        error: 'Processing failed due to corrupted image files'
      },
      {
        id: '5',
        name: 'Family Photos Restoration',
        status: 'paused',
        progress: 40,
        imagesCount: 12,
        processedCount: 5,
        preset: 'Restoration',
        priority: 'high',
        createdAt: '2024-01-15T07:00:00Z',
        estimatedCompletion: '2024-01-15T08:30:00Z',
        processingTime: 20
      }
    ]
    setJobs(mockJobs)
    setFilteredJobs(mockJobs)
  }, [])

  useEffect(() => {
    let filtered = jobs

    if (searchQuery) {
      filtered = filtered.filter(job => 
        job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.preset.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(job => job.priority === priorityFilter)
    }

    setFilteredJobs(filtered)
  }, [jobs, searchQuery, statusFilter, priorityFilter])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued': return <Clock className="w-4 h-4" />
      case 'processing': return <Zap className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'failed': return <AlertCircle className="w-4 h-4" />
      case 'paused': return <Pause className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'paused': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'normal': return 'bg-blue-100 text-blue-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const pauseJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'paused' as const } : job
    ))
  }

  const resumeJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'processing' as const } : job
    ))
  }

  const cancelJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId))
  }

  const retryJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: 'queued' as const, progress: 0, error: undefined } : job
    ))
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
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm">Dashboard</Link>
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
              <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors font-medium text-sm py-2">Dashboard</Link>
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

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Processing Jobs
              </h1>
              <p className="text-slate-600">
                Monitor and manage your image processing jobs
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Link href="/upload">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  New Job
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search jobs by name or preset..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-slate-900">{job.name}</h3>
                        <Badge className={getStatusColor(job.status)}>
                          {getStatusIcon(job.status)}
                          <span className="ml-1 capitalize">{job.status}</span>
                        </Badge>
                        <Badge className={getPriorityColor(job.priority)}>
                          {job.priority} Priority
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <FileImage className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {job.processedCount}/{job.imagesCount} images
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {formatDate(job.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {job.processingTime > 0 ? `${job.processingTime}m` : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Sparkles className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{job.preset}</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {job.status === 'processing' && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-600">Progress</span>
                            <span className="text-sm text-slate-900">{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                          <div className="text-xs text-slate-500 mt-1">
                            Estimated completion: {formatDate(job.estimatedCompletion)}
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {job.error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-800">{job.error}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {job.status === 'processing' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => pauseJob(job.id)}
                        >
                          <Pause className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {job.status === 'paused' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resumeJob(job.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {job.status === 'failed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => retryJob(job.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                      
                      {job.status === 'completed' && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cancelJob(job.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredJobs.length === 0 && (
            <Card className="text-center py-16">
              <CardContent>
                <Sparkles className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  No jobs found
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Start processing your first images to see jobs here'
                  }
                </p>
                {!searchQuery && statusFilter === 'all' && priorityFilter === 'all' && (
                  <Link href="/upload">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Processing
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
