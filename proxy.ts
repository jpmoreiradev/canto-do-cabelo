import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET!)

const ADMIN_PAGES = ['/admin', '/tv']
const ADMIN_API = ['/api/queue/next', '/api/queue/served', '/api/queue/remove', '/api/config/services']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAdminPage = ADMIN_PAGES.some((p) => pathname.startsWith(p)) && pathname !== '/admin/login'
  const isAdminApi =
    (ADMIN_API.some((p) => pathname.startsWith(p)) && req.method === 'POST') ||
    (pathname === '/api/queue' && req.method === 'POST')

  if (!isAdminPage && !isAdminApi) return NextResponse.next()

  const token = req.cookies.get('session')?.value

  if (!token) {
    if (isAdminApi) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  try {
    await jwtVerify(token, secret())
    return NextResponse.next()
  } catch {
    if (isAdminApi) return NextResponse.json({ error: 'Sessão expirada' }, { status: 401 })
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}

export const config = {
  matcher: ['/admin/:path*', '/tv', '/api/queue/:path*', '/api/queue', '/api/config/:path*'],
}
