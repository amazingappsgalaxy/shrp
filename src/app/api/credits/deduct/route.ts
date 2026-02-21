import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth-simple'
import { UnifiedCreditsService } from '@/lib/unified-credits'

export async function POST(request: NextRequest) {
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

        // Parse request body
        const body = await request.json()
        const { amount, taskId, description } = body

        if (!amount || !taskId || !description) {
            return NextResponse.json(
                { error: 'Missing required fields: amount, taskId, description' },
                { status: 400 }
            )
        }

        // Deduct credits
        const result = await UnifiedCreditsService.deductCredits(
            userId,
            amount,
            taskId,
            description
        )

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to deduct credits'
                },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: true,
            deducted: result.deducted
        })
    } catch (error) {
        console.error('Error deducting credits:', error)
        return NextResponse.json(
            { error: 'Failed to deduct credits' },
            { status: 500 }
        )
    }
}
