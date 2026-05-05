import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!)

export async function signToken() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('12h')
    .sign(secret())
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret())
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  const store = await cookies()
  const token = store.get('session')?.value
  if (!token) return null
  return verifyToken(token)
}

export function getTokenFromRequest(req: NextRequest) {
  return req.cookies.get('session')?.value ?? null
}
