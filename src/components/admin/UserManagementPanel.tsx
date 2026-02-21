'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Shield,
  Mail,
  Calendar,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  name: string
  subscription_status: string
  api_usage: number
  monthly_api_limit: number
  created_at: string
  last_login_at: string
  is_admin: boolean
  is_email_verified: boolean
  creditBalance?: number
}

export function UserManagementPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [showCreditsDialog, setShowCreditsDialog] = useState(false)
  const [creditsAmount, setCreditsAmount] = useState('')
  const [creditsReason, setCreditsReason] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to load users')

      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || user.subscription_status === filterStatus

    return matchesSearch && matchesFilter
  })

  const handleGrantCredits = async () => {
    if (!selectedUser || !creditsAmount) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/admin/grant-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: parseInt(creditsAmount),
          reason: creditsReason || 'Admin grant'
        })
      })

      if (!response.ok) throw new Error('Failed to grant credits')

      toast.success(`Granted ${creditsAmount} credits to ${selectedUser.email}`)
      setShowCreditsDialog(false)
      setCreditsAmount('')
      setCreditsReason('')
      loadUsers()
    } catch (error) {
      console.error('Error granting credits:', error)
      toast.error('Failed to grant credits')
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const response = await fetch('/api/admin/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, updates })
      })

      if (!response.ok) throw new Error('Failed to update user')

      toast.success('User updated successfully')
      loadUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'enterprise': return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'premium': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-900/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-bold text-white">User Management</h2>
              <p className="text-sm text-gray-400">Manage platform users and their permissions</p>
            </div>
          </div>
          <Badge variant="outline" className="text-blue-400 border-blue-400/30">
            {users.length} total users
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search users by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48 bg-gray-800 border-gray-600">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border border-gray-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-800/50">
                <TableHead className="text-white">User</TableHead>
                <TableHead className="text-white">Status</TableHead>
                <TableHead className="text-white">Credits</TableHead>
                <TableHead className="text-white">Usage</TableHead>
                <TableHead className="text-white">Last Login</TableHead>
                <TableHead className="text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-700">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium">{user.name}</p>
                            {user.is_admin && (
                              <Shield className="w-4 h-4 text-purple-400" />
                            )}
                            {!user.is_email_verified && (
                              <Mail className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(user.subscription_status)}>
                        {user.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-white">
                        {user.creditBalance?.toLocaleString() || '0'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-white">
                        {user.api_usage.toLocaleString()} / {user.monthly_api_limit.toLocaleString()}
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full"
                          style={{
                            width: `${Math.min((user.api_usage / user.monthly_api_limit) * 100, 100)}%`
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowCreditsDialog(true)
                          }}
                        >
                          <CreditCard className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUserDialog(true)
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Credits Dialog */}
      <Dialog open={showCreditsDialog} onOpenChange={setShowCreditsDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Grant Credits</DialogTitle>
            <DialogDescription className="text-gray-400">
              Grant credits to {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Credits Amount</Label>
              <Input
                type="number"
                placeholder="Enter credits amount"
                value={creditsAmount}
                onChange={(e) => setCreditsAmount(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Reason (optional)</Label>
              <Input
                placeholder="Reason for granting credits"
                value={creditsReason}
                onChange={(e) => setCreditsReason(e.target.value)}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreditsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGrantCredits}>
              Grant Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
            <DialogDescription className="text-gray-400">
              Modify user settings and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label className="text-white">Subscription Status</Label>
                <Select
                  value={selectedUser.subscription_status}
                  onValueChange={(value) =>
                    setSelectedUser({ ...selectedUser, subscription_status: value })
                  }
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">No Active Plan</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Monthly API Limit</Label>
                <Input
                  type="number"
                  value={selectedUser.monthly_api_limit}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      monthly_api_limit: parseInt(e.target.value) || 0
                    })
                  }
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUserDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleUpdateUser(selectedUser.id, {
                    subscription_status: selectedUser.subscription_status,
                    monthly_api_limit: selectedUser.monthly_api_limit
                  })
                  setShowUserDialog(false)
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}