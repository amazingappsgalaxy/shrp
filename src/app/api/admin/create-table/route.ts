import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Creating checkout_sessions table...')

    const admin = supabaseAdmin
    if (!admin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured' },
        { status: 500 }
      )
    }

    // Create the table using basic Supabase operations
    // First, let's try to create a test record to see if table exists
    const { data: testInsert, error: insertError } = await (admin as any)
      .from('checkout_sessions')
      .insert({
        subscription_id: 'test_sub_' + Date.now(),
        user_id: '00000000-0000-0000-0000-000000000000',
        user_email: 'test@example.com',
        plan: 'test',
        billing_period: 'monthly',
        amount: 2500,
        currency: 'USD',
        status: 'test'
      })
      .select()

    if (insertError && insertError.message.includes('relation "public.checkout_sessions" does not exist')) {
      console.log('❌ Table does not exist, need to create it manually in Supabase dashboard')
      return NextResponse.json({
        success: false,
        error: 'Table does not exist. Please create it manually in Supabase dashboard or via SQL editor.',
        sql: `
CREATE TABLE public.checkout_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id text NOT NULL UNIQUE,
  payment_id text,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  plan text NOT NULL,
  billing_period text NOT NULL,
  amount integer NOT NULL,
  currency text DEFAULT 'USD',
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX checkout_sessions_subscription_id_idx ON public.checkout_sessions(subscription_id);
CREATE INDEX checkout_sessions_user_id_idx ON public.checkout_sessions(user_id);

ALTER TABLE public.checkout_sessions DISABLE ROW LEVEL SECURITY;
        `
      })
    }

    // Clean up test record
    if (testInsert && testInsert.length > 0) {
      await (admin as any)
        .from('checkout_sessions')
        .delete()
        .eq('id', testInsert[0].id)
    }

    if (insertError && !insertError.message.includes('relation "public.checkout_sessions" does not exist')) {
      console.error('❌ Error testing table:', insertError)
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    console.log('✅ Table exists and working')
    return NextResponse.json({ success: true, message: 'Table exists and working' })

  } catch (error) {
    console.error('❌ Error in create-table endpoint:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}