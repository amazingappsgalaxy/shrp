import { NextRequest, NextResponse } from 'next/server'
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

    console.log('🔍 [ADMIN] Checking credits for email:', email)

    // Find user by email using admin client
    const { data: users, error: userError } = await admin
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .limit(1)

    if (userError) {
      console.error('User lookup error:', userError)
      return NextResponse.json(
        { error: 'Failed to lookup user', details: userError },
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
    console.log('👤 [ADMIN] Found user:', user.id, user.email)

    // Get all credits using admin client
    const { data: credits, error: creditsError } = await admin
      .from('credits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (creditsError) {
      console.error('Credits lookup error:', creditsError)
      return NextResponse.json(
        { error: 'Failed to lookup credits', details: creditsError },
        { status: 500 }
      )
    }

    // Get all credit transactions using admin client (table might be outside typed schema)
    const { data: transactions, error: transError } = await (admin as any)
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (transError) {
      console.error('Transactions lookup error:', transError)
    }

    console.log('💰 [ADMIN] Credits found:', credits?.length || 0)
    console.log('📄 [ADMIN] Transactions found:', transactions?.length || 0)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      credits: credits || [],
      transactions: transactions || [],
      summary: {
        totalCredits: credits?.reduce((sum, c) => sum + c.amount, 0) || 0,
        activeCredits: credits?.filter(c => c.is_active).reduce((sum, c) => sum + c.amount, 0) || 0,
        expiredCredits: credits?.filter(c => !c.is_active).reduce((sum, c) => sum + c.amount, 0) || 0
      }
    })

  } catch (error) {
    console.error('❌ [ADMIN] Error checking credits:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}