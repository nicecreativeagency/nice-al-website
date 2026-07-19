import { getSessionCookie } from 'better-auth/cookies'
import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (path === '/hub/login' || path.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL('/hub/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/hub/:path*'],
}
