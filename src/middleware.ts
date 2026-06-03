import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicPaths = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
]

const publicApiPaths = [
  '/api/auth',
  '/api/signup',
  '/api/webhooks',
  '/api/health',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // CSRF protection: verify Origin header on state-mutating API requests
  // Skip CSRF for auth and webhook endpoints - they need special handling
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    if (!pathname.startsWith('/api/webhooks') && !pathname.startsWith('/api/auth')) {
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')
      
      // Allow requests with valid origin, null origin (mobile WebView), or same-host requests
      if (origin && host) {
        const originHost = new URL(origin).host
        if (originHost !== host) {
          return NextResponse.json(
            { success: false, error: 'Invalid request origin' },
            { status: 403 }
          )
        }
      }
      // null origin is allowed for mobile WebViews and same-site requests
    }
  }

  // Allow public pages
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Allow public API routes (prefix match)
  if (publicApiPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check for auth token (all non-public routes require auth)
  const token = await getToken({ req: request })

  if (!token) {
    // API routes return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }
    // Pages redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Block unverified users from financial operations
  const financialApiPaths = [
    '/api/wallet/transfer',
    '/api/wallet/withdraw',
    '/api/payments',
    '/api/crypto/buy',
    '/api/crypto/sell',
    '/api/crypto/send',
    '/api/paystack/initialize',
    '/api/invoices',
    '/api/bank-accounts',
  ]

  const requiresVerification = financialApiPaths.some((p) => pathname.startsWith(p))
  if (requiresVerification && !token.isVerified) {
    return NextResponse.json(
      { success: false, error: 'Please verify your email before performing financial operations.' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
