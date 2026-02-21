'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PricingConfigPanel } from './PricingConfigPanel'
import ModelPricingManager from './ModelPricingManager'
import { UserManagementPanel } from './UserManagementPanel'
import { SalesAnalytics } from './SalesAnalytics'
import { SystemSettings } from './SystemSettings'
import { AdminActivityLog } from './AdminActivityLog'
import { adminApi, isAdminAuthenticated } from '@/lib/admin-client'
import {
  Users,
  BarChart3,
  Shield,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'

interface AdminStats {
  totalUsers: number
  activeUsers: number
  totalTasks: number
  completedTasks: number
  totalRevenue: number
  monthlyRevenue: number
  systemStatus: 'healthy' | 'warning' | 'error'
  taskProcessingRate: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Load admin stats
  useEffect(() => {
    const loadAdminData = async () => {
      if (!isAdminAuthenticated()) {
        setLoading(false)
        return
      }

      try {
        await loadStats()
      } catch (error) {
        console.error('Error loading admin data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadAdminData()
  }, [])

  const loadStats = async () => {
    try {
      const systemStats = await adminApi.getSystemStats()

      // Transform the data to match our AdminStats interface
      setStats({
        totalUsers: systemStats.users.total,
        activeUsers: systemStats.users.active,
        totalTasks: systemStats.tasks.total,
        completedTasks: systemStats.tasks.completed,
        totalRevenue: systemStats.revenue.total,
        monthlyRevenue: systemStats.revenue.monthly || 0,
        systemStatus: systemStats.tasks.processing > 10 ? 'warning' : 'healthy',
        taskProcessingRate: systemStats.tasks.completed / Math.max(systemStats.tasks.total, 1) * 100
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      toast.error('Failed to load dashboard statistics')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAdminAuthenticated()) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="p-8 bg-red-950/20 border-red-500/30 text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have administrative privileges.</p>
          <Button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/'
              }
            }}
            className="mt-4"
            variant="outline"
          >
            Return to Home
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage your SharpII AI platform</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" className="text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10 hover:text-yellow-300">
              <Link href="/admin/api-model-tester">
                <BarChart3 className="w-4 h-4 mr-2" />
                API Tester
              </Link>
            </Button>
            <Badge variant="outline" className="text-green-400 border-green-400/30">
              <CheckCircle className="w-3 h-3 mr-1" />
              Admin Access
            </Badge>
            <Badge variant="outline" className="text-blue-400 border-blue-400/30">
              Admin User
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-gray-900/50 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-green-400">
                  {stats.activeUsers} active today
                </span>
              </div>
            </Card>

            <Card className="p-6 bg-gray-900/50 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Tasks Completed</p>
                  <p className="text-2xl font-bold text-white">{stats.completedTasks}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-400">
                  {stats.taskProcessingRate}/min avg
                </span>
              </div>
            </Card>

            <Card className="p-6 bg-gray-900/50 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-white">${stats.monthlyRevenue}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="mt-2">
                <span className="text-sm text-emerald-400">
                  ${stats.totalRevenue} total
                </span>
              </div>
            </Card>

            <Card className="p-6 bg-gray-900/50 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">System Status</p>
                  <p className="text-2xl font-bold text-white capitalize">{stats.systemStatus}</p>
                </div>
                {stats.systemStatus === 'healthy' ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : stats.systemStatus === 'warning' ? (
                  <AlertCircle className="w-8 h-8 text-yellow-500" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-red-500" />
                )}
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-400">
                  Status: Active
                </span>
              </div>
            </Card>
          </div>
        )}

        {/* Main Admin Panel */}
        <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-gray-900/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="model-pricing">Model Pricing</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-gray-900/50 border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Platform Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Models:</span>
                    <span className="text-white">3 models enabled</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Processing Queue:</span>
                    <span className="text-white">{stats?.totalTasks || 0} tasks</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Storage Used:</span>
                    <span className="text-white">2.4 GB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">API Rate Limit:</span>
                    <span className="text-green-400">Normal</span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gray-900/50 border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-white text-sm">System health check completed</p>
                      <p className="text-gray-400 text-xs">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-white text-sm">New user registration: user@example.com</p>
                      <p className="text-gray-400 text-xs">5 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-white text-sm">Payment processed: $25.00</p>
                      <p className="text-gray-400 text-xs">12 minutes ago</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagementPanel />
          </TabsContent>

          <TabsContent value="pricing" className="mt-6">
            <PricingConfigPanel />
          </TabsContent>

          <TabsContent value="model-pricing" className="mt-6">
            <ModelPricingManager />
          </TabsContent>

          <TabsContent value="sales" className="mt-6">
            <SalesAnalytics />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <AdminActivityLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
