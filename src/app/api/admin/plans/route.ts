import { NextRequest, NextResponse } from 'next/server'
import { PRICING_PLANS } from '@/lib/pricing-config'

function checkAdminAuth(request: NextRequest): boolean {
  const adminEmail = request.headers.get('x-admin-email')
  return !!(adminEmail && adminEmail.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase())
}

// Map PRICING_PLANS to admin-friendly format (strip non-serializable icon component)
function mapPlan(plan: (typeof PRICING_PLANS)[number], index: number) {
  return {
    id: plan.name.toLowerCase().replace(/\s+/g, '-'),
    name: plan.name,
    subtitle: plan.subtitle,
    description: plan.description,
    monthly_price: plan.price.monthly,
    yearly_price: plan.price.yearly,
    credits: plan.credits.monthly,
    images_estimate: plan.credits.images,
    resolution: plan.resolution,
    skin_enhancement: plan.skinEnhancement,
    modes: plan.modes,
    processing: plan.processing,
    support: plan.support || null,
    features: plan.features,
    is_popular: plan.highlight || false,
    badge: plan.badge || null,
    sort_order: index,
  }
}

export async function GET(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const plans = PRICING_PLANS.map(mapPlan)
    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Admin plans GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, monthly_price, yearly_price, credits, features, is_popular, badge } = body as {
      id: string
      monthly_price?: number
      yearly_price?: number
      credits?: number
      features?: string[]
      is_popular?: boolean
      badge?: string | null
    }

    if (!id) {
      return NextResponse.json({ error: 'Plan id is required' }, { status: 400 })
    }

    // Find matching plan to validate existence
    const existingPlan = PRICING_PLANS.find(
      (p) => p.name.toLowerCase().replace(/\s+/g, '-') === id
    )

    if (!existingPlan) {
      return NextResponse.json({ error: `Plan '${id}' not found` }, { status: 404 })
    }

    // Return the updated plan (in-memory merge, no DB persistence yet)
    const updatedPlan = {
      ...mapPlan(existingPlan, PRICING_PLANS.indexOf(existingPlan)),
      ...(monthly_price !== undefined && { monthly_price }),
      ...(yearly_price !== undefined && { yearly_price }),
      ...(credits !== undefined && { credits }),
      ...(features !== undefined && { features }),
      ...(is_popular !== undefined && { is_popular }),
      ...(badge !== undefined && { badge }),
      updated_at: new Date().toISOString(),
      note: 'Plan updates are not persisted to DB yet. Edit src/lib/pricing-config.ts to make permanent changes.',
    }

    return NextResponse.json({ success: true, plan: updatedPlan })
  } catch (error) {
    console.error('Admin plans PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
