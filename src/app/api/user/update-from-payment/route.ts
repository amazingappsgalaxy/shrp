import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/simple-auth'
import { createClient } from '@supabase/supabase-js'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    // Get user session from cookie
    const token = request.cookies.get('session')?.value
    const sessionData = token ? await getSession(token) : null

    if (!sessionData?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const sessionUser = sessionData.user!

    const { paymentData } = await request.json()

    if (!paymentData) {
      return NextResponse.json(
        { error: 'Payment data is required' },
        { status: 400 }
      )
    }

    // Extract user information from payment data
    const userUpdates: any = {}
    
    // Update user information based on payment metadata and billing info
    if (paymentData.customer_email && paymentData.customer_email !== sessionUser.email) {
      userUpdates.email = paymentData.customer_email
    }
    
    if (paymentData.customer_name) {
      userUpdates.name = paymentData.customer_name
    }
    
    if (paymentData.billing_address) {
      userUpdates.billingAddress = {
        street: paymentData.billing_address.line1,
        city: paymentData.billing_address.city,
        state: paymentData.billing_address.state,
        postalCode: paymentData.billing_address.postal_code,
        country: paymentData.billing_address.country
      }
    }
    
    if (paymentData.phone) {
      userUpdates.phone = paymentData.phone
    }

    // Update subscription information if available
    if (paymentData.plan && paymentData.billingPeriod) {
      userUpdates.subscriptionPlan = paymentData.plan
      userUpdates.billingPeriod = paymentData.billingPeriod
      userUpdates.subscriptionStatus = 'active'
      userUpdates.lastPaymentDate = Date.now()
    }

    // Only update if there are changes
    if (Object.keys(userUpdates).length > 0) {
      console.log('📝 Updating user profile with payment data:', userUpdates)
      
      // Update user in Supabase
      const supabase = createClient(config.database.supabaseUrl, config.database.supabaseServiceKey)
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...userUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionUser.id)

      if (error) {
        console.error('❌ Error updating user profile:', error)
        return NextResponse.json({
          error: 'Failed to update user profile',
          details: error.message
        }, { status: 500 })
      }

      console.log('✅ User profile updated successfully')
      
      return NextResponse.json({
        success: true,
        updatedFields: Object.keys(userUpdates),
        message: 'User profile updated from payment data'
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'No profile updates needed'
      })
    }

  } catch (error) {
    console.error('❌ Error updating user profile from payment:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update user profile',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}