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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params

    // Fetch user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, created_at, subscription_status, last_login_at')
      .eq('id', id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch latest active subscription
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('plan, status, start_date, end_date, next_billing_date')
      .eq('user_id', id)
      .order('next_billing_date', { ascending: false })
      .limit(1)

    const subscription = subscriptions?.[0] || null

    // Fetch active credits grouped by type
    const now = new Date().toISOString()
    const { data: creditsData } = await supabase
      .from('credits')
      .select('amount, type')
      .eq('user_id', id)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)

    let subscriptionCredits = 0
    let permanentCredits = 0
    for (const row of creditsData || []) {
      if (row.type === 'subscription') {
        subscriptionCredits += row.amount || 0
      } else {
        permanentCredits += row.amount || 0
      }
    }

    // Fetch last 50 credit transactions
    const { data: creditHistory } = await supabase
      .from('credit_transactions')
      .select('id, amount, type, description, created_at, transaction_id')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Fetch last 50 history items
    const { data: tasks } = await supabase
      .from('history_items')
      .select('id, model_name, status, credits_used, page_name, error_message, created_at, completed_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Get actual task count
    const { count: taskCount } = await supabase
      .from('history_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        subscription_status: user.subscription_status,
        last_login_at: user.last_login_at,
        plan: subscription?.plan || 'free',
      },
      subscription: subscription
        ? {
            plan_name: subscription.plan,
            status: subscription.status,
            current_period_start: subscription.start_date,
            current_period_end: subscription.end_date,
            next_billing_date: subscription.next_billing_date,
          }
        : null,
      credits: {
        subscription: subscriptionCredits,
        permanent: permanentCredits,
        total: subscriptionCredits + permanentCredits,
      },
      credit_history: (creditHistory || []).map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type,
        description: t.description,
        created_at: t.created_at,
        transaction_id: t.transaction_id,
      })),
      tasks: (tasks || []).map((t) => ({
        id: t.id,
        model_name: t.model_name,
        status: t.status,
        credits_used: t.credits_used,
        page_name: t.page_name,
        error_message: t.error_message,
        created_at: t.created_at,
        completed_at: t.completed_at,
      })),
      task_count: taskCount || 0,
    })
  } catch (error) {
    console.error('Admin user detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
