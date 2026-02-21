import { NextRequest, NextResponse } from 'next/server'
import { CreditsService } from '@/lib/credits-service'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured' },
        { status: 500 }
      )
    }
    const admin = supabaseAdmin

    console.log('🔍 Checking credits for email:', email)

    // Find user by email
    const { data: users, error: userError } = await admin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .limit(1)

    if (userError) {
      console.error('User lookup error:', userError)
      return NextResponse.json(
        { error: 'Failed to lookup user' },
        { status: 500 }
      )
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const user = users[0]!
    console.log('👤 Found user:', user.id, user.email)

    // Get user's credit balance
    const balance = await CreditsService.getUserCredits(user.id)
    console.log('💰 Credit balance:', balance)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      credits: {
        total: balance.total,
        subscription_credits: balance.subscription_credits,
        permanent_credits: balance.permanent_credits,
        subscription_expire_at: balance.subscription_expire_at
      }
    })

  } catch (error) {
    console.error('❌ Error checking credits:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}