import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Admin client not configured' },
      { status: 500 }
    )
  }

  try {
    console.log('Checking admin database schema...')

    // Check if is_admin column exists by trying to select it
    const { error: checkError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .limit(1)

    if (checkError && checkError.message.includes('column "is_admin" does not exist')) {
      console.log('is_admin column does not exist, needs to be added manually')

      return NextResponse.json({
        success: false,
        needsManualSetup: true,
        message: 'Database schema needs manual update. Please run the following SQL commands in your Supabase SQL editor:',
        sql: [
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;',
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT \'\';',
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;',
          'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NOW();'
        ]
      })
    }

    console.log('Database schema is ready')

    return NextResponse.json({
      success: true,
      message: 'Admin database schema is ready'
    })

  } catch (error) {
    console.error('Database setup error:', error)
    return NextResponse.json(
      {
        error: 'Failed to check database schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}