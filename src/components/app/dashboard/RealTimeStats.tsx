'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Database,
  Clock,
  HardDrive,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react'

interface RealTimeStatsProps {
  stats: {
    totalImages: number
    enhancedImages: number
    processingImages: number
    totalStorage: number
    apiUsage: number
    monthlyApiLimit: number
    subscriptionStatus: string
  }
  usageStats: {
    imagesProcessed: number
    storageUsed: number
    storageLimit: number
    processingTime: number
    creditsUsed: number
    creditsRemaining: number
  }
}

export default function RealTimeStats({ stats, usageStats }: RealTimeStatsProps) {
  const storagePercentage = (usageStats.storageUsed / usageStats.storageLimit) * 100
  const apiUsagePercentage = (stats.apiUsage / stats.monthlyApiLimit) * 100
  const enhancementRate = stats.totalImages > 0 ? (stats.enhancedImages / stats.totalImages) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Images */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Images</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalImages}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+12% this month</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
      </Card>

      {/* Enhanced Images */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Enhanced</p>
              <p className="text-3xl font-bold text-slate-900">{stats.enhancedImages}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-slate-600">{enhancementRate.toFixed(1)}% success rate</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
      </Card>

      {/* Processing */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Processing</p>
              <p className="text-3xl font-bold text-slate-900">{stats.processingImages}</p>
              <div className="flex items-center mt-2">
                {stats.processingImages > 0 ? (
                  <>
                    <Clock className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-yellow-600">In progress</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-600">All complete</span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
      </Card>

      {/* Storage */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Storage</p>
              <p className="text-3xl font-bold text-slate-900">{usageStats.storageUsed.toFixed(1)}GB</p>
              <div className="flex items-center mt-2">
                <Progress value={storagePercentage} className="w-16 h-2 mr-2" />
                <span className="text-sm text-slate-600">{storagePercentage.toFixed(0)}%</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
      </Card>

      {/* API Usage Card */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-600" />
              <span>API Usage</span>
            </div>
            <Badge variant={stats.subscriptionStatus === 'pro' ? 'default' : 'secondary'}>
              {stats.subscriptionStatus.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Monthly Usage</span>
                <span className="text-sm text-slate-900">
                  {stats.apiUsage} / {stats.monthlyApiLimit}
                </span>
              </div>
              <Progress value={apiUsagePercentage} className="h-3" />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0</span>
                <span>{stats.monthlyApiLimit}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{usageStats.creditsRemaining}</div>
                <div className="text-sm text-slate-600">Credits Left</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-time Status */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span>Real-time Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Supabase</div>
                <div className="text-sm text-green-600">Connected</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-slate-900">Processing</div>
                <div className="text-sm text-blue-600">
                  {stats.processingImages > 0 ? `${stats.processingImages} active` : 'Idle'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}