import { NextResponse } from 'next/server'
import { ensureAdminUser } from '@/lib/admin-auth'

export async function POST() {
  try {
    console.log('Setting up admin user...')

    // Create admin user with your credentials
    const adminEmail = process.env.ADMIN_EMAIL || ''
    const adminPassword = process.env.ADMIN_PASSWORD || ''
    const adminName = 'Sharpii Admin'

    const adminUserId = await ensureAdminUser(adminEmail, adminPassword, adminName)

    console.log('Admin user setup completed:', adminUserId)

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      adminUserId
    })

  } catch (error) {
    console.error('Admin user setup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to setup admin user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}