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

    console.log('🔧 [ADMIN] Executing RLS fix for credits system...')

    const results: any[] = []

    // Execute SQL commands one by one
    const sqlCommands = [
      'ALTER TABLE credits DISABLE ROW LEVEL SECURITY;',
      'ALTER TABLE credit_transactions DISABLE ROW LEVEL SECURITY;',
      'GRANT SELECT, INSERT, UPDATE ON credits TO authenticated;',
      'GRANT SELECT, INSERT, UPDATE ON credit_transactions TO authenticated;',
      'GRANT ALL ON credits TO service_role;',
      'GRANT ALL ON credit_transactions TO service_role;'
    ]

    for (const sql of sqlCommands) {
      try {
        console.log(`Executing: ${sql}`)
        const { data, error } = await (admin as any).rpc('exec_sql', { sql_query: sql })

        if (error) {
          console.error(`SQL Error for "${sql}":`, error)
          results.push({ sql, success: false, error: error.message })
        } else {
          console.log(`✅ Success: ${sql}`)
          results.push({ sql, success: true, data })
        }
      } catch (err) {
        console.error(`Exception for "${sql}":`, err)
        results.push({ sql, success: false, error: err instanceof Error ? err.message : 'Unknown error' })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'RLS fix attempted. Check results for individual command status.',
      results,
      note: 'If exec_sql function is not available, you may need to run the SQL commands manually in Supabase dashboard.'
    })

  } catch (error) {
    console.error('❌ [ADMIN] Error fixing RLS:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}