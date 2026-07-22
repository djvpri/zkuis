import crypto from 'node:crypto'
import { cookies } from 'next/headers'
import { getCrossAppSecret } from './secrets'

// Sesi SSO Zomet untuk ZKuis — TANPA dependency JWT (pakai node:crypto).
// Token dari Z One ditandatangani HS256 dengan CROSS_APP_SECRET.

export type ZSession = { sub: string; email: string; name: string }
export const SESSION_COOKIE = 'zkuis_session'

function b64urlJson(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url')
}
function hmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('base64url')
}

// Verifikasi HS256 JWT. HMAC dihitung atas string "header.payload" yang
// DITERIMA apa adanya (tidak di-reserialize), jadi cocok dengan token yang
// dibuat Z One via `jsonwebtoken`.
function verifyJwt(token: string, secret: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, b, s] = parts
  const expected = hmac(`${h}.${b}`, secret)
  const sBuf = Buffer.from(s)
  const eBuf = Buffer.from(expected)
  if (sBuf.length !== eBuf.length || !crypto.timingSafeEqual(sBuf, eBuf)) return null
  let payload: Record<string, unknown>
  try { payload = JSON.parse(Buffer.from(b, 'base64url').toString()) } catch { return null }
  const exp = payload.exp as number | undefined
  if (exp && Math.floor(Date.now() / 1000) > exp) return null
  return payload
}

export function verifySsoToken(token: string): ZSession | null {
  let payload: Record<string, unknown> | null
  try { payload = verifyJwt(token, getCrossAppSecret()) } catch { return null }
  if (!payload) return null
  const sub = payload.sub as string, email = payload.email as string
  if (!sub || !email) return null
  if (payload.app && payload.app !== 'zkuis') return null
  return { sub, email, name: (payload.name as string) || email }
}

export function issueSessionCookie(s: ZSession): string {
  const secret = getCrossAppSecret()
  const header = b64urlJson({ alg: 'HS256', typ: 'JWT' })
  const payload = b64urlJson({ sub: s.sub, email: s.email, name: s.name, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 })
  const data = `${header}.${payload}`
  return `${data}.${hmac(data, secret)}`
}

export async function getSession(): Promise<ZSession | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value
  if (!raw) return null
  let payload: Record<string, unknown> | null
  try { payload = verifyJwt(raw, getCrossAppSecret()) } catch { return null }
  if (!payload?.email) return null
  return { sub: payload.sub as string, email: payload.email as string, name: (payload.name as string) || (payload.email as string) }
}
