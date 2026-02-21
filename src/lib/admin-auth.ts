// Admin authentication and role management
import { supabaseAdmin } from './supabase'
import { hashPassword } from './auth-simple'
import type { User } from './auth-simple'

export interface AdminUser extends User {
  isAdmin: boolean
}

// Check if user is admin
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    console.error('Admin client not available')
    return false
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return data?.is_admin || false
  } catch (error) {
    console.error('Admin check error:', error)
    return false
  }
}

// Create or update admin user
export async function ensureAdminUser(email: string, password: string, name: string): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Admin client not available')
  }

  try {
    // Check if user already exists (don't select is_admin in case column doesn't exist)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      // Try to update existing user to be admin
      try {
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            is_admin: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)

        if (updateError && !updateError.message.includes('column "is_admin" does not exist')) {
          console.error('Error updating user to admin:', updateError)
          throw new Error('Failed to update user as admin')
        }
      } catch (updateErr) {
        console.log('Could not update is_admin column (may not exist):', updateErr)
        // Continue anyway - the user exists and can be used
      }

      console.log('Updated existing user to admin:', existingUser.id)
      return existingUser.id
    }

    // Create new admin user
    const passwordHash = await hashPassword(password)

    // Try to create user with admin fields, fall back if columns don't exist
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: email.toLowerCase(),
          name,
          password_hash: passwordHash,
          subscription_status: 'enterprise', // Give admin enterprise privileges
          api_usage: 0,
          monthly_api_limit: 100000, // Higher limit for admin
          is_admin: true,
          is_email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating admin user:', error)
        throw new Error('Failed to create admin user')
      }

      console.log('Created admin user:', data.id)
      return data.id
    } catch (createErr) {
      console.log('Failed to create with admin columns, trying basic user creation:', createErr)

      // Fall back to basic user creation (without is_admin, etc.)
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          email: email.toLowerCase(),
          name,
          password_hash: passwordHash,
          subscription_status: 'enterprise',
          api_usage: 0,
          monthly_api_limit: 100000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error creating basic admin user:', error)
        throw new Error('Failed to create admin user')
      }

      console.log('Created basic admin user (needs manual admin flag):', data.id)
      return data.id
    }
  } catch (error) {
    console.error('Admin user creation error:', error)
    throw error
  }
}

// Admin-specific user queries
export async function getAllUsers(limit: number = 50, offset: number = 0) {
  if (!supabaseAdmin) {
    throw new Error('Admin client not available')
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        subscription_status,
        api_usage,
        monthly_api_limit,
        is_admin,
        is_email_verified,
        created_at,
        updated_at,
        last_login_at
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching users:', error)
      throw new Error('Failed to fetch users')
    }

    return data || []
  } catch (error) {
    console.error('Get all users error:', error)
    throw error
  }
}

// Update user by admin
export async function adminUpdateUser(userId: string, updates: {
  name?: string
  subscription_status?: string
  monthly_api_limit?: number
  is_admin?: boolean
}) {
  if (!supabaseAdmin) {
    throw new Error('Admin client not available')
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      throw new Error('Failed to update user')
    }

    console.log('Admin updated user:', userId)
  } catch (error) {
    console.error('Admin update user error:', error)
    throw error
  }
}

// Grant credits to user (admin function)
export async function grantCreditsToUser(userId: string, amount: number) {
  if (!supabaseAdmin) {
    throw new Error('Admin client not available')
  }

  try {
    // First, get current API usage to calculate new limit
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('api_usage, monthly_api_limit')
      .eq('id', userId)
      .single()

    if (fetchError) {
      throw new Error('Failed to fetch current user data')
    }

    // Update monthly limit (essentially granting credits)
    const newLimit = (currentUser.monthly_api_limit || 0) + amount

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        monthly_api_limit: newLimit,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Error granting credits:', error)
      throw new Error('Failed to grant credits')
    }

    console.log(`Granted ${amount} credits to user ${userId}. New limit: ${newLimit}`)

    // Create credits record
    await supabaseAdmin
      .from('credits')
      .insert({
        user_id: userId,
        amount,
        type: 'granted',
        source: 'admin',
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
        is_active: true,
        created_at: new Date().toISOString(),
        metadata: { granted_by: 'admin', reason: 'admin_grant' }
      })

  } catch (error) {
    console.error('Grant credits error:', error)
    throw error
  }
}

// Get system stats (admin function)
export async function getSystemStats() {
  if (!supabaseAdmin) {
    throw new Error('Admin client not available')
  }

  try {
    // Get user counts
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    const { count: activeUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gt('last_login_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Get task counts
    const { count: totalTasks } = await supabaseAdmin
      .from('history_items')
      .select('*', { count: 'exact', head: true })

    const { count: completedTasks } = await supabaseAdmin
      .from('history_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: processingTasks } = await supabaseAdmin
      .from('history_items')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing')

    // Get revenue data (if payments table exists)
    const { data: revenueData } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'completed')

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0

    return {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0
      },
      tasks: {
        total: totalTasks || 0,
        completed: completedTasks || 0,
        processing: processingTasks || 0
      },
      revenue: {
        total: totalRevenue
      }
    }
  } catch (error) {
    console.error('Get system stats error:', error)
    return {
      users: { total: 0, active: 0 },
      tasks: { total: 0, completed: 0, processing: 0 },
      revenue: { total: 0 }
    }
  }
}

// Search users (admin function)
export async function searchUsers(query: string, limit: number = 20) {
  if (!supabaseAdmin) {
    throw new Error('Admin client not available')
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        name,
        subscription_status,
        api_usage,
        monthly_api_limit,
        is_admin,
        created_at,
        last_login_at
      `)
      .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching users:', error)
      throw new Error('Failed to search users')
    }

    return data || []
  } catch (error) {
    console.error('Search users error:', error)
    throw error
  }
}
