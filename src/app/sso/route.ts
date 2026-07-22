import { NextRequest, NextResponse } from 'next/server'
import { verifySsoToken, issueSessionCookie, SESSION_COOKIE } from '@/lib/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function publicOrigin(req: NextRequest): string {
  const forced = process.env.NEXT_PUBLIC_APP_URL
  if (forced) return forced.replace(/\/+$/, '')
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  if (host) return `${proto}://${host}`
  return req.nextUrl.origin
}

// Penerima SSO dari Z One: Z One redirect ke /sso?token=JWT → verifikasi →
// set cookie sesi → masuk ke aplikasi.
export async function GET(req: NextRequest) {
  const origin = publicOrigin(req)
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(`${origin}/login?err=no_token`)

  const session = verifySsoToken(token)
  if (!session) return NextResponse.redirect(`${origin}/login?err=invalid_token`)

  const res = NextResponse.redirect(`${origin}/generate`)
  res.cookies.set(SESSION_COOKIE, issueSessionCookie(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
