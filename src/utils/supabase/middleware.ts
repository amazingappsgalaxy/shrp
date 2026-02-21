import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Default: allow request to continue
  const response = NextResponse.next({ request })

  // Only check for presence of session cookie in middleware (Edge)
  // Do NOT validate against server-side store here, as Edge and Node runtimes don't share memory
  const hasSessionCookie = !!request.cookies.get('session')?.value
  const hasDemoCookie = !!request.cookies.get('demo')?.value

  // If user is already authenticated and visits the signin page, redirect to dashboard
  if (hasSessionCookie && request.nextUrl.pathname.startsWith('/app/signin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users to signin (except for signin/auth pages, or demo mode)
  if (
    !hasSessionCookie &&
    !hasDemoCookie &&
    !request.nextUrl.pathname.startsWith('/app/signin') &&
    !request.nextUrl.pathname.startsWith('/app/auth') &&
    request.nextUrl.searchParams.get('demo') !== 'true'
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/signin'
    return NextResponse.redirect(url)
  }

  return response
}