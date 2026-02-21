import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { adminSecret } = await request.json()

    // Simple admin secret check
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Invalid admin secret' },
        { status: 401 }
      )
    }

    const admin = supabaseAdmin
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured' },
        { status: 500 }
      )
    }

    console.log('🔧 [ADMIN] Disabling RLS for credits tables...')

    // Disable RLS on credits table
    const { error: creditsRLSError } = await (admin as any).rpc('disable_rls_credits')
    if (creditsRLSError) {
      console.log('Credits RLS disable error (might not exist):', creditsRLSError)
    }

    // Disable RLS on credit_transactions table
    const { error: transRLSError } = await (admin as any).rpc('disable_rls_credit_transactions')
    if (transRLSError) {
      console.log('Transactions RLS disable error (might not exist):', transRLSError)
    }

    // Alternative approach: try direct SQL execution
    try {
      await (admin as any).rpc('exec_sql', {
        sql_query: 'ALTER TABLE credits DISABLE ROW LEVEL SECURITY;'
      })
      console.log('✅ Credits RLS disabled')
    } catch (err) {
      console.log('Direct SQL not available, that\'s okay')
    }

    try {
      await (admin as any).rpc('exec_sql', {
        sql_query: 'ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;'
      })
      console.log('✅ Credit transactions RLS disabled')
    } catch (err) {
      console.log('Direct SQL not available, that\'s okay')
    }

    return NextResponse.json({
      success: true,
      message: 'RLS disable attempted. If this doesn\'t work, you\'ll need to run the SQL manually in Supabase dashboard.'
    })

  } catch (error) {
    console.error('❌ [ADMIN] Error disabling RLS:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}