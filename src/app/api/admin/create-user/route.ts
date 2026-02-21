import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { adminSecret, email, name } = await request.json()

    // Simple admin secret check
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Invalid admin secret' },
        { status: 401 }
      )
    }

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      )
    }

    const admin = supabaseAdmin
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured' },
        { status: 500 }
      )
    }

    console.log('👤 [ADMIN] Creating user:', email, name)

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await admin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .limit(1)

    if (checkError) {
      console.error('User check error:', checkError)
      return NextResponse.json(
        { error: 'Failed to check existing user', details: checkError },
        { status: 500 }
      )
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUsers[0]
      })
    }

    // Create new user
    const { data: newUser, error: createError } = await admin
      .from('users')
      .insert({
        id: uuidv4(),
        email,
        name,
        password_hash: 'webhook_user', // Placeholder for webhook-created users
        subscription_status: 'free',
        api_usage: 0,
        monthly_api_limit: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: '',
        is_email_verified: true,
        last_login_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('User creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create user', details: createError },
        { status: 500 }
      )
    }

    console.log('✅ [ADMIN] User created:', newUser.id, newUser.email)

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }
    })

  } catch (error) {
    console.error('❌ [ADMIN] Error creating user:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}