import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession as getServerSession } from '@/lib/auth-simple'

export async function GET(request: NextRequest) {
  const start = Date.now()
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value
    
    console.log(`[Session API] Check started. Token present: ${!!sessionToken}`)
    
    if (!sessionToken) {
      console.log(`[Session API] No token, returning null (took ${Date.now() - start}ms)`)
      return NextResponse.json({ user: null, session: null })
    }
    
    console.log(`[Session API] Verifying token: ${sessionToken.substring(0, 10)}...`)
    
    // Wrap getServerSession with a timeout to prevent hanging if DB is down
    const sessionPromise = getServerSession(sessionToken)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session verification timed out')), 5000)
    )
    
    let data;
    try {
      data = await Promise.race([sessionPromise, timeoutPromise]) as any
    } catch (e) {
      console.error('[Session API] Session verification failed/timed out:', e)
      return NextResponse.json({ user: null, session: null })
    }

    console.log(`[Session API] Verification result: ${data ? 'Found' : 'Null'} (took ${Date.now() - start}ms)`)
    
    if (!data || !data.user) {
      // Clear invalid/expired cookie on response
      const res = NextResponse.json({ user: null, session: null })
      res.cookies.set('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })
      return res
    }

    // Normalize shape to minimal fields expected by client
    const user = data.user && {
      id: (data.user as any).id,
      email: (data.user as any).email,
      name: (data.user as any).name ?? (data.user as any).full_name ?? ((data.user as any).email?.split?.('@')?.[0] ?? 'User'),
    }

    const session = data.session && {
      id: (data.session as any).id,
      token: (data.session as any).token,
    }

    return NextResponse.json({ user, session })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null, session: null })
  }
}