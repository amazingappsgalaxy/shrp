import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { supabaseAdmin, supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        // Get user session
        const cookieStore = await cookies()
        const sessionToken = cookieStore.get('session')?.value

        if (!sessionToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const session = await getSession(sessionToken)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = session.user.id
        const client = (supabaseAdmin ?? supabase) as any

        // Get payment history
        const { data: payments, error } = await client
            .from('payments')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50)

        if (error) {
            console.error('Error fetching payments:', error)
            return NextResponse.json(
                { error: 'Failed to fetch payments' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            payments: payments || []
        })
    } catch (error) {
        console.error('Error fetching payment history:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payment history' },
            { status: 500 }
        )
    }
}
