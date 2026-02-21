'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  Save,
  RotateCcw,
  Database,
  Globe,
  Shield,
  Bell,
  Zap,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface SystemConfig {
  general: {
    siteName: string
    siteDescription: string
    maintenanceMode: boolean
    registrationEnabled: boolean
    emailVerificationRequired: boolean
    maxFileSize: number
    supportedFormats: string[]
  }
  api: {
    rateLimitEnabled: boolean
    maxRequestsPerMinute: number
    maxRequestsPerHour: number
    maxConcurrentTasks: number
    taskTimeout: number
  }
  pricing: {
    defaultCredits: number
    referralBonus: number
    promotionEnabled: boolean
    promotionMessage: string
  }
  notifications: {
    emailNotifications: boolean
    webhookUrl: string
    slackWebhook: string
    discordWebhook: string
  }
  storage: {
    maxStoragePerUser: number
    imageRetentionDays: number
    cleanupEnabled: boolean
  }
}

export function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [systemHealth, setSystemHealth] = useState<any>(null)

  useEffect(() => {
    loadConfig()
    loadSystemHealth()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/system-config')
      if (!response.ok) throw new Error('Failed to load config')

      const data = await response.json()
      setConfig(data.config)
    } catch (error) {
      console.error('Error loading system config:', error)
      toast.error('Failed to load system configuration')
    } finally {
      setLoading(false)
    }
  }

  const loadSystemHealth = async () => {
    try {
      const response = await fetch('/api/admin/system-health')
      if (!response.ok) throw new Error('Failed to load system health')

      const data = await response.json()
      setSystemHealth(data.health)
    } catch (error) {
      console.error('Error loading system health:', error)
    }
  }

  const saveConfig = async () => {
    if (!config) return

    try {
      setSaving(true)
      const response = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      })

      if (!response.ok) throw new Error('Failed to save config')

      toast.success('System configuration saved successfully')
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving system config:', error)
      toast.error('Failed to save system configuration')
    } finally {
      setSaving(false)
    }
  }

  const resetConfig = async () => {
    if (!confirm('Are you sure you want to reset to default configuration?')) {
      return
    }

    try {
      const response = await fetch('/api/admin/system-config/reset', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Failed to reset config')

      toast.success('Configuration reset to defaults')
      loadConfig()
      setHasChanges(false)
    } catch (error) {
      console.error('Error resetting config:', error)
      toast.error('Failed to reset configuration')
    }
  }

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    if (!config) return

    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    })
    setHasChanges(true)
  }

  const testWebhook = async (webhookUrl: string, type: string) => {
    try {
      const response = await fetch('/api/admin/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl, type })
      })

      if (!response.ok) throw new Error('Webhook test failed')

      toast.success(`${type} webhook test successful`)
    } catch (error) {
      console.error('Error testing webhook:', error)
      toast.error(`${type} webhook test failed`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Loading system settings...</p>
        </div>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center p-12">
        <p className="text-red-400">Failed to load system configuration</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gray-900/50 border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-white">System Settings</h2>
              <p className="text-sm text-gray-400">Configure platform settings and behavior</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-400 border-orange-400/30">
                Unsaved Changes
              </Badge>
            )}
            <Button variant="outline" onClick={resetConfig}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={saveConfig} disabled={saving || !hasChanges}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>

      {/* System Health */}
      {systemHealth && (
        <Card className="p-6 bg-gray-900/50 border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-500" />
            System Health
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white">Database</p>
                <p className="text-sm text-gray-400">{systemHealth.database ? 'Connected' : 'Disconnected'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white">Storage</p>
                <p className="text-sm text-gray-400">{systemHealth.storage || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white">API</p>
                <p className="text-sm text-gray-400">{systemHealth.api || 'Operational'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-white">Uptime</p>
                <p className="text-sm text-gray-400">{systemHealth.uptime || '99.9%'}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Configuration Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-900/50">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-500" />
              General Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white">Site Name</Label>
                <Input
                  value={config.general.siteName}
                  onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Max File Size (MB)</Label>
                <Input
                  type="number"
                  value={config.general.maxFileSize}
                  onChange={(e) => updateConfig('general', 'maxFileSize', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-white">Site Description</Label>
                <Textarea
                  value={config.general.siteDescription}
                  onChange={(e) => updateConfig('general', 'siteDescription', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                <div>
                  <p className="text-white">Maintenance Mode</p>
                  <p className="text-sm text-gray-400">Enable to show maintenance page</p>
                </div>
                <Switch
                  checked={config.general.maintenanceMode}
                  onCheckedChange={(checked) => updateConfig('general', 'maintenanceMode', checked)}
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                <div>
                  <p className="text-white">Registration Enabled</p>
                  <p className="text-sm text-gray-400">Allow new user registrations</p>
                </div>
                <Switch
                  checked={config.general.registrationEnabled}
                  onCheckedChange={(checked) => updateConfig('general', 'registrationEnabled', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6">
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              API Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white">Requests per Minute</Label>
                <Input
                  type="number"
                  value={config.api.maxRequestsPerMinute}
                  onChange={(e) => updateConfig('api', 'maxRequestsPerMinute', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Requests per Hour</Label>
                <Input
                  type="number"
                  value={config.api.maxRequestsPerHour}
                  onChange={(e) => updateConfig('api', 'maxRequestsPerHour', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Max Concurrent Tasks</Label>
                <Input
                  type="number"
                  value={config.api.maxConcurrentTasks}
                  onChange={(e) => updateConfig('api', 'maxConcurrentTasks', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Task Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={config.api.taskTimeout}
                  onChange={(e) => updateConfig('api', 'taskTimeout', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                <div>
                  <p className="text-white">Rate Limiting</p>
                  <p className="text-sm text-gray-400">Enable API rate limiting</p>
                </div>
                <Switch
                  checked={config.api.rateLimitEnabled}
                  onCheckedChange={(checked) => updateConfig('api', 'rateLimitEnabled', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6">
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-500" />
              Pricing Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white">Default Credits (New Users)</Label>
                <Input
                  type="number"
                  value={config.pricing.defaultCredits}
                  onChange={(e) => updateConfig('pricing', 'defaultCredits', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Referral Bonus Credits</Label>
                <Input
                  type="number"
                  value={config.pricing.referralBonus}
                  onChange={(e) => updateConfig('pricing', 'referralBonus', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-white">Promotion Message</Label>
                <Textarea
                  value={config.pricing.promotionMessage}
                  onChange={(e) => updateConfig('pricing', 'promotionMessage', e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                  rows={2}
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                <div>
                  <p className="text-white">Promotions Enabled</p>
                  <p className="text-sm text-gray-400">Show promotional messages</p>
                </div>
                <Switch
                  checked={config.pricing.promotionEnabled}
                  onCheckedChange={(checked) => updateConfig('pricing', 'promotionEnabled', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              Notification Settings
            </h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                <div>
                  <p className="text-white">Email Notifications</p>
                  <p className="text-sm text-gray-400">Send email notifications to users</p>
                </div>
                <Switch
                  checked={config.notifications.emailNotifications}
                  onCheckedChange={(checked) => updateConfig('notifications', 'emailNotifications', checked)}
                />
              </div>
              <div>
                <Label className="text-white">Webhook URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={config.notifications.webhookUrl}
                    onChange={(e) => updateConfig('notifications', 'webhookUrl', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="https://your-webhook-url.com"
                  />
                  <Button
                    variant="outline"
                    onClick={() => testWebhook(config.notifications.webhookUrl, 'Generic')}
                  >
                    Test
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-white">Slack Webhook</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={config.notifications.slackWebhook}
                    onChange={(e) => updateConfig('notifications', 'slackWebhook', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="https://hooks.slack.com/services/..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => testWebhook(config.notifications.slackWebhook, 'Slack')}
                  >
                    Test
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-white">Discord Webhook</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={config.notifications.discordWebhook}
                    onChange={(e) => updateConfig('notifications', 'discordWebhook', e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => testWebhook(config.notifications.discordWebhook, 'Discord')}
                  >
                    Test
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="mt-6">
          <Card className="p-6 bg-gray-900/50 border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" />
              Storage Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-white">Max Storage per User (GB)</Label>
                <Input
                  type="number"
                  value={config.storage.maxStoragePerUser}
                  onChange={(e) => updateConfig('storage', 'maxStoragePerUser', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white">Image Retention (days)</Label>
                <Input
                  type="number"
                  value={config.storage.imageRetentionDays}
                  onChange={(e) => updateConfig('storage', 'imageRetentionDays', parseInt(e.target.value))}
                  className="bg-gray-800 border-gray-600 text-white mt-1"
                />
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-600 rounded-lg">
                <div>
                  <p className="text-white">Automatic Cleanup</p>
                  <p className="text-sm text-gray-400">Auto-delete old images</p>
                </div>
                <Switch
                  checked={config.storage.cleanupEnabled}
                  onCheckedChange={(checked) => updateConfig('storage', 'cleanupEnabled', checked)}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}