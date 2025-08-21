'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Clock, 
  Download, 
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Calendar,
  Settings,
  Plus,
  Menu,
  X
} from 'lucide-react'
import Link from 'next/link'

interface RecentActivity {
  id: string
  type: 'upload' | 'process' | 'download' | 'share'
  description: string
  timestamp: string
  status: 'completed' | 'processing' | 'failed'
}

interface UsageStats {
  imagesProcessed: number
  storageUsed: number
  storageLimit: number
  processingTime: number
  creditsUsed: number
  creditsRemaining: number
}

export default function DashboardPage() {
  const [usageStats, setUsageStats] = useState<UsageStats>({
    imagesProcessed: 0,
    storageUsed: 0,
    storageLimit: 0,
    processingTime: 0,
    creditsUsed: 0,
    creditsRemaining: 0
  })
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  useEffect(() => {
    // Mock data - in real app this would come from API
    setUsageStats({
      imagesProcessed: 1247,
      storageUsed: 2.4, // GB
      storageLimit: 10, // GB
      processingTime: 45.2, // hours
      creditsUsed: 89,
      creditsRemaining: 111
    })

    setRecentActivity([
      {
        id: '1',
        type: 'process',
        description: 'Enhanced portrait_001.jpg with Portrait preset',
        timestamp: '2 minutes ago',
        status: 'completed'
      },
      {
        id: '2',
        type: 'upload',
        description: 'Uploaded 5 new images',
        timestamp: '15 minutes ago',
        status: 'completed'
      },
      {
        id: '3',
        type: 'download',
        description: 'Downloaded enhanced_landscape.zip',
        timestamp: '1 hour ago',
        status: 'completed'
      },
      {
        id: '4',
        type: 'process',
        description: 'Processing product_photos batch',
        timestamp: '2 hours ago',
        status: 'processing'
      },
      {
        id: '5',
        type: 'share',
        description: 'Shared gallery with team',
        timestamp: '3 hours ago',
        status: 'completed'
      }
    ])
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="w-4 h-4" />
      case 'process': return <Sparkles className="w-4 h-4" />
      case 'download': return <Download className="w-4 h-4" />
      case 'share': return <Users className="w-4 h-4" />
      default: return <ImageIcon className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const storagePercentage = (usageStats.storageUsed / usageStats.storageLimit) * 100

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
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
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
            </div>
          </div>
        )}
      </nav>

      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-slate-600">
              Here's what's happening with your images today.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Link href="/upload">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Upload Images</h3>
                  <p className="text-sm text-slate-600">Add new images to enhance</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/gallery">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">View Gallery</h3>
                  <p className="text-sm text-slate-600">Browse your enhanced images</p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/editor">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Enhance Studio</h3>
                  <p className="text-sm text-slate-600">Fine-tune your images</p>
                </CardContent>
              </Card>
            </Link>
            
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">New Project</h3>
                <p className="text-sm text-slate-600">Start a batch process</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Usage Statistics */}
            <div className="lg:col-span-2">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Usage Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">Storage Used</span>
                        <span className="text-sm text-slate-900">
                          {usageStats.storageUsed}GB / {usageStats.storageLimit}GB
                        </span>
                      </div>
                      <Progress value={storagePercentage} className="h-2 mb-4" />
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-slate-900">
                            {usageStats.imagesProcessed.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-600">Images Processed</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-900">
                            {usageStats.processingTime.toFixed(1)}h
                          </div>
                          <div className="text-sm text-slate-600">Processing Time</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-900">
                            {usageStats.creditsRemaining}
                          </div>
                          <div className="text-sm text-slate-600">Credits Left</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">Processing Speed</div>
                            <div className="text-sm text-slate-600">Fast Mode</div>
                          </div>
                        </div>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">Quality Level</div>
                            <div className="text-sm text-slate-600">Professional</div>
                          </div>
                        </div>
                        <Badge variant="secondary">Premium</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span>Recent Activity</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">{activity.description}</p>
                          <p className="text-xs text-slate-500">{activity.timestamp}</p>
                        </div>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button variant="outline" size="sm">
                      View All Activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Account Status */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Plan</span>
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      Pro
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Billing Cycle</span>
                    <span className="text-sm text-slate-900">Monthly</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Next Billing</span>
                    <span className="text-sm text-slate-900">Feb 15, 2024</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Manage Billing
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>This Month</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Images Enhanced</span>
                    <span className="text-sm font-medium text-slate-900">247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Processing Time</span>
                    <span className="text-sm font-medium text-slate-900">12.3h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Credits Used</span>
                    <span className="text-sm font-medium text-slate-900">89</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Storage Added</span>
                    <span className="text-sm font-medium text-slate-900">1.2GB</span>
                  </div>
                </CardContent>
              </Card>

              {/* Support */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" size="sm" className="w-full">
                    Documentation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Contact Support
                  </Button>
                  <Button variant="outline" size="sm" className="w-full">
                    Community Forum
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
