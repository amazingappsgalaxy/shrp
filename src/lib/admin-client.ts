// Simple admin client for making authenticated admin API calls

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem('adminAuthenticated') === 'true'
}

export function getAdminEmail(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('adminEmail')
}

export async function adminFetch(url: string, options: RequestInit = {}): Promise<Response> {
  if (!isAdminAuthenticated()) {
    throw new Error('Admin not authenticated')
  }

  const adminEmail = getAdminEmail()

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Email': adminEmail || '',
      ...options.headers,
    }
  })
}

// Admin API helper functions
export const adminApi = {
  // Get system stats
  async getSystemStats() {
    try {
      const response = await adminFetch('/api/admin/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      return await response.json()
    } catch (error) {
      console.error('Failed to get system stats:', error)
      return {
        users: { total: 0, active: 0 },
        tasks: { total: 0, completed: 0, processing: 0 },
        revenue: { total: 0 }
      }
    }
  },

  // Get all users
  async getAllUsers(limit = 50, offset = 0) {
    try {
      const response = await adminFetch(`/api/admin/users?limit=${limit}&offset=${offset}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      return await response.json()
    } catch (error) {
      console.error('Failed to get users:', error)
      return []
    }
  },

  // Search users
  async searchUsers(query: string) {
    try {
      const response = await adminFetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to search users')
      return await response.json()
    } catch (error) {
      console.error('Failed to search users:', error)
      return []
    }
  },

  // Update user
  async updateUser(userId: string, updates: any) {
    try {
      const response = await adminFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update user')
      return await response.json()
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  },

  // Grant credits
  async grantCredits(userId: string, amount: number) {
    try {
      const response = await adminFetch('/api/admin/credits/grant', {
        method: 'POST',
        body: JSON.stringify({ userId, amount })
      })
      if (!response.ok) throw new Error('Failed to grant credits')
      return await response.json()
    } catch (error) {
      console.error('Failed to grant credits:', error)
      throw error
    }
  },

  // Get pricing config
  async getPricingConfig() {
    try {
      const response = await adminFetch('/api/admin/pricing/config')
      if (!response.ok) throw new Error('Failed to fetch pricing config')
      return await response.json()
    } catch (error) {
      console.error('Failed to get pricing config:', error)
      return null
    }
  },

  // Update pricing config
  async updatePricingConfig(config: any) {
    try {
      const response = await adminFetch('/api/admin/pricing/config', {
        method: 'POST',
        body: JSON.stringify(config)
      })
      if (!response.ok) throw new Error('Failed to update pricing config')
      return await response.json()
    } catch (error) {
      console.error('Failed to update pricing config:', error)
      throw error
    }
  },

  // Get sales data
  async getSalesData(timeRange = '30d') {
    try {
      const response = await adminFetch(`/api/admin/sales?range=${timeRange}`)
      if (!response.ok) throw new Error('Failed to fetch sales data')
      return await response.json()
    } catch (error) {
      console.error('Failed to get sales data:', error)
      return []
    }
  },

  // Get admin activity log
  async getActivityLog(limit = 50) {
    try {
      const response = await adminFetch(`/api/admin/activity?limit=${limit}`)
      if (!response.ok) throw new Error('Failed to fetch activity log')
      return await response.json()
    } catch (error) {
      console.error('Failed to get activity log:', error)
      return []
    }
  }
}