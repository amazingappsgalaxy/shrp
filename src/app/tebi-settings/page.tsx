'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Cloud, 
  Database, 
  Shield, 
  Activity, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Trash2,
  Download,
  Upload
} from 'lucide-react'
import { tebiConfig, FILE_CATEGORIES } from '@/lib/tebi'
import { tebiApi } from '@/lib/api/tebi'

interface TebiStats {
  totalFiles: number
  totalSize: number
  categories: Record<string, { count: number; size: number }>
  lastSync: Date
}

export default function TebiSettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<TebiStats | null>(null)
  const [config, setConfig] = useState({
    endpoint: tebiConfig.endpoint,
    region: tebiConfig.region,
    bucketName: tebiConfig.bucketName,
  })
  const [isConnected, setIsConnected] = useState(false)
  const [connectionTest, setConnectionTest] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')

  useEffect(() => {
    checkConnection()
    loadStats()
  }, [])

  const checkConnection = async () => {
    try {
      // Try to list files to test connection
      await tebiApi.listFiles(FILE_CATEGORIES.UPLOADS)
      setIsConnected(true)
    } catch (error) {
      setIsConnected(false)
    }
  }

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const categories = Object.values(FILE_CATEGORIES)
      const categoryStats: Record<string, { count: number; size: number }> = {}
      let totalFiles = 0
      let totalSize = 0

      for (const category of categories) {
        const files = await tebiApi.listFiles(category)
        const categorySize = files.reduce((sum, file) => sum + file.size, 0)
        
        categoryStats[category] = {
          count: files.length,
          size: categorySize
        }
        
        totalFiles += files.length
        totalSize += categorySize
      }

      setStats({
        totalFiles,
        totalSize,
        categories: categoryStats,
        lastSync: new Date()
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const testConnection = async () => {
    setConnectionTest('testing')
    try {
      await tebiApi.listFiles(FILE_CATEGORIES.UPLOADS)
      setConnectionTest('success')
      setIsConnected(true)
      
      setTimeout(() => setConnectionTest('idle'), 3000)
    } catch (error) {
      setConnectionTest('error')
      setIsConnected(false)
      
      setTimeout(() => setConnectionTest('idle'), 3000)
    }
  }

  const saveConfig = async () => {
    // In a real app, you'd save this to your backend/database
    // For now, we'll just update the local state
    setConfig(config)
    alert('Configuration saved! (Note: This is a demo - config is not persisted)')
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const cleanupAllTemp = async () => {
    if (confirm('Are you sure you want to clean up all temporary files? This action cannot be undone.')) {
      try {
        const deletedCount = await tebiApi.cleanupTempFiles(0) // 0 hours = all temp files
        alert(`Cleaned up ${deletedCount} temporary files`)
        loadStats()
      } catch (error) {
        alert('Failed to cleanup temporary files')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Tebi.io Settings</h1>
                <p className="text-gray-600">Configure and manage your Tebi.io cloud storage integration</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center space-x-4">
              <Badge 
                variant={isConnected ? 'default' : 'destructive'}
                className="text-sm"
              >
                {isConnected ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Connected to Tebi.io
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Not Connected
                  </>
                )}
              </Badge>
              
              <Button
                size="sm"
                variant="outline"
                onClick={testConnection}
                disabled={connectionTest === 'testing'}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${connectionTest === 'testing' ? 'animate-spin' : ''}`} />
                Test Connection
              </Button>

              {connectionTest === 'success' && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Connection successful!
                </Badge>
              )}

              {connectionTest === 'error' && (
                <Badge variant="destructive">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Connection failed
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="configuration">Configuration</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Files</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats ? stats.totalFiles.toLocaleString() : '...'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Files stored in Tebi.io</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Total Storage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats ? formatBytes(stats.totalSize) : '...'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Used storage space</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Last Sync</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats ? stats.lastSync.toLocaleDateString() : '...'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last data refresh</p>
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Storage by Category</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats ? (
                    <div className="space-y-3">
                      {Object.entries(stats.categories).map(([category, data]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="capitalize">
                              {category}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {data.count} files
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {formatBytes(data.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                      <p className="text-gray-600 mt-2">Loading storage statistics...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      onClick={loadStats}
                      disabled={isLoading}
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                    >
                      <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh Statistics</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={cleanupAllTemp}
                      className="h-20 flex flex-col items-center justify-center space-y-2"
                    >
                      <Trash2 className="w-6 h-6" />
                      <span>Cleanup Temp Files</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuration Tab */}
            <TabsContent value="configuration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Connection Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="endpoint">Endpoint URL</Label>
                      <Input
                        id="endpoint"
                        value={config.endpoint}
                        onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                        placeholder="https://your-bucket.tebi.io"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="region">Region</Label>
                      <Input
                        id="region"
                        value={config.region}
                        onChange={(e) => setConfig({ ...config, region: e.target.value })}
                        placeholder="your-region"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bucket">Bucket Name</Label>
                    <Input
                      id="bucket"
                      value={config.bucketName}
                      onChange={(e) => setConfig({ ...config, bucketName: e.target.value })}
                      placeholder="your-bucket-name"
                    />
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button onClick={saveConfig}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </Button>
                    
                    <Button variant="outline" onClick={testConnection}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5" />
                    <span>Security Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span>Access keys are stored securely in environment variables</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span>All file transfers are encrypted in transit</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span>Files are stored with configurable access policies</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Storage Tab */}
            <TabsContent value="storage" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="w-5 h-5" />
                    <span>Storage Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Storage Optimization</h4>
                      <p className="text-sm text-blue-700">
                        Tebi.io automatically optimizes storage costs and provides lifecycle management 
                        for your files. Configure retention policies and automatic cleanup rules.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                        <Upload className="w-6 h-6" />
                        <span>Upload Test File</span>
                      </Button>
                      
                      <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                        <Download className="w-6 h-6" />
                        <span>Download Sample</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5" />
                    <span>System Maintenance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-medium text-yellow-900 mb-2">Maintenance Tasks</h4>
                      <p className="text-sm text-yellow-700">
                        Regular maintenance helps keep your Tebi.io storage organized and cost-effective.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        onClick={cleanupAllTemp}
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                      >
                        <Trash2 className="w-6 h-6" />
                        <span>Cleanup Temp Files</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={loadStats}
                        disabled={isLoading}
                        className="h-20 flex flex-col items-center justify-center space-y-2"
                      >
                        <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh Statistics</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
