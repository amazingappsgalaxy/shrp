'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Download,
  Clock,
  User,
  Settings,
  DollarSign,
  Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminActivityRecord {
  id: string
  admin_user_id: string
  adminEmail?: string
  action: string
  target_type?: string
  target_id?: string
  details: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

export function AdminActivityLog() {
  const [activities, setActivities] = useState<AdminActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [targetFilter, setTargetFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/activity-log')
      if (!response.ok) throw new Error('Failed to load activities')

      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error loading activities:', error)
      toast.error('Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadActivities()
    setRefreshing(false)
    toast.success('Activity log refreshed')
  }

  const exportLog = async () => {
    try {
      const response = await fetch('/api/admin/export-activity-log')
      if (!response.ok) throw new Error('Failed to export log')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `admin-activity-log-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Activity log exported')
    } catch (error) {
      console.error('Error exporting log:', error)
      toast.error('Failed to export activity log')
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.adminEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.target_type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === 'all' || activity.action.includes(actionFilter)
    const matchesTarget = targetFilter === 'all' || activity.target_type === targetFilter

    return matchesSearch && matchesAction && matchesTarget
  })

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="w-4 h-4 text-blue-500" />
    if (action.includes('pricing') || action.includes('credits')) return <DollarSign className="w-4 h-4 text-green-500" />
    if (action.includes('system') || action.includes('config')) return <Settings className="w-4 h-4 text-purple-500" />
    if (action.includes('admin') || action.includes('auth')) return <Shield className="w-4 h-4 text-red-500" />
    return <Activity className="w-4 h-4 text-gray-500" />
  }

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('grant')) return 'bg-green-500/20 text-green-300 border-green-500/30'
    if (action.includes('update') || action.includes('modify')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    if (action.includes('delete') || action.includes('remove')) return 'bg-red-500/20 text-red-300 border-red-500/30'
    if (action.includes('login') || action.includes('access')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-900/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-purple-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Admin Activity Log</h2>
              <p className="text-sm text-gray-400">Monitor all administrative actions and changes</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-purple-400 border-purple-400/30">
              {activities.length} total actions
            </Badge>
            <Button variant="outline" onClick={refreshData} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={exportLog}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search by action, admin email, or target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="create">Create Actions</SelectItem>
              <SelectItem value="update">Update Actions</SelectItem>
              <SelectItem value="delete">Delete Actions</SelectItem>
              <SelectItem value="login">Login Actions</SelectItem>
              <SelectItem value="pricing">Pricing Actions</SelectItem>
            </SelectContent>
          </Select>
          <Select value={targetFilter} onValueChange={setTargetFilter}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-600">
              <SelectValue placeholder="Target type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Targets</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="pricing">Pricing</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities Table */}
        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800/50">
                <TableHead className="text-white">Timestamp</TableHead>
                <TableHead className="text-white">Admin</TableHead>
                <TableHead className="text-white">Action</TableHead>
                <TableHead className="text-white">Target</TableHead>
                <TableHead className="text-white">Details</TableHead>
                <TableHead className="text-white">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Loading activity log...
                  </TableCell>
                </TableRow>
              ) : filteredActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No activities found
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivities.map((activity) => (
                  <TableRow key={activity.id} className="border-gray-700">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <div>
                          <p className="text-white text-sm">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {new Date(activity.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-white">
                          {activity.adminEmail || `Admin ${activity.admin_user_id.slice(0, 8)}...`}
                        </p>
                        <p className="text-gray-400 text-xs">{activity.admin_user_id.slice(0, 8)}...</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(activity.action)}
                        <Badge className={getActionColor(activity.action)}>
                          {formatActionName(activity.action)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {activity.target_type && (
                        <div>
                          <p className="text-white capitalize">{activity.target_type}</p>
                          {activity.target_id && (
                            <p className="text-gray-400 text-xs font-mono">
                              {activity.target_id.slice(0, 8)}...
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        {activity.details && typeof activity.details === 'object' ? (
                          <details className="cursor-pointer">
                            <summary className="text-gray-400 text-sm hover:text-gray-300">
                              View details
                            </summary>
                            <pre className="text-xs text-gray-300 mt-1 whitespace-pre-wrap">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400 text-sm">
                            {typeof activity.details === 'string'
                              ? activity.details.slice(0, 50) + (activity.details.length > 50 ? '...' : '')
                              : 'No details'
                            }
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-400 font-mono text-sm">
                        {activity.ip_address || 'Unknown'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}