'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  Upload, 
  Sparkles, 
  Download, 
  Users, 
  Image as ImageIcon,
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react'

interface Activity {
  id: string
  type: 'upload' | 'process' | 'download' | 'share'
  description: string
  timestamp: string
  status: 'completed' | 'processing' | 'failed'
  metadata?: any
}

interface ActivityFeedProps {
  activities: Activity[]
  isRealTime?: boolean
}

export default function ActivityFeed({ activities, isRealTime = true }: ActivityFeedProps) {
  const getActivityIcon = (type: string, status: string) => {
    const iconClass = "w-4 h-4"
    
    if (status === 'processing') {
      return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
    }
    
    switch (type) {
      case 'upload': return <Upload className={iconClass} />
      case 'process': return <Sparkles className={iconClass} />
      case 'download': return <Download className={iconClass} />
      case 'share': return <Users className={iconClass} />
      default: return <ImageIcon className={iconClass} />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'processing': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload': return 'bg-blue-100 text-blue-600'
      case 'process': return 'bg-purple-100 text-purple-600'
      case 'download': return 'bg-green-100 text-green-600'
      case 'share': return 'bg-orange-100 text-orange-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span>Activity Feed</span>
            {isRealTime && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600">Live</span>
              </div>
            )}
          </div>
          <Badge variant="secondary">{activities.length} events</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No recent activity</p>
            <p className="text-sm text-slate-400">
              Upload some images to see your activity here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                className={`flex items-start space-x-4 p-3 rounded-lg transition-all duration-300 ${
                  index === 0 && isRealTime ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type, activity.status)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(activity.status)}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">{activity.timestamp}</p>
                    
                    {activity.metadata && (
                      <div className="flex items-center space-x-2 text-xs text-slate-400">
                        {activity.metadata.fileSize && (
                          <span>{(activity.metadata.fileSize / 1024 / 1024).toFixed(1)}MB</span>
                        )}
                        {activity.metadata.duration && (
                          <span>{activity.metadata.duration}s</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {activity.status === 'processing' && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {activities.length > 0 && (
          <div className="mt-6 text-center">
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}