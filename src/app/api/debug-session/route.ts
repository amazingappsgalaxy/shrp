import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/simple-auth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    console.log('🔍 Debug session - token:', sessionToken);
    
    if (!sessionToken) {
      return NextResponse.json({
        hasToken: false,
        token: null,
        session: null,
        user: null
      });
    }
    
    const sessionData = await getSession(sessionToken);
    
    return NextResponse.json({
      hasToken: true,
      token: sessionToken,
      tokenLength: sessionToken.length,
      session: sessionData?.session,
      user: sessionData?.user
    });
  } catch (error) {
    console.error('Debug session error:', error);
    return NextResponse.json({
      error: 'Failed to debug session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}