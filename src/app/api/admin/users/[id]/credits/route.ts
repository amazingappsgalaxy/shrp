import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function checkAdminAuth(request: NextRequest): boolean {
  const adminEmail = request.headers.get('x-admin-email')
  return !!(adminEmail && adminEmail.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase())
}

// POST: Grant credits to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { amount, type, reason } = body as {
      amount: number
      type: 'permanent' | 'subscription'
      reason: string
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }
    if (!type || !['permanent', 'subscription'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type, must be permanent or subscription' }, { status: 400 })
    }

    const expiresAt =
      type === 'subscription'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : null

    const { data, error } = await supabase.rpc('add_credits_atomic', {
      p_user_id: id,
      p_amount: amount,
      p_type: type,
      p_transaction_id: `admin_grant_${Date.now()}`,
      p_description: reason || `Admin grant: ${amount} ${type} credits`,
      p_expires_at: expiresAt,
    })

    if (error) {
      console.error('Admin grant credits error:', error)
      return NextResponse.json({ error: 'Failed to grant credits', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Granted ${amount} ${type} credits to user ${id}`,
      result: data,
    })
  } catch (error) {
    console.error('Admin grant credits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Deduct credits from user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { amount, reason } = body as { amount: number; reason: string }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('deduct_credits_atomic', {
      p_user_id: id,
      p_amount: amount,
      p_transaction_id: `admin_deduct_${Date.now()}`,
      p_description: reason || `Admin deduction: ${amount} credits`,
    })

    if (error) {
      console.error('Admin deduct credits error:', error)
      return NextResponse.json({ error: 'Failed to deduct credits', details: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Deducted ${amount} credits from user ${id}`,
      result: data,
    })
  } catch (error) {
    console.error('Admin deduct credits error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
