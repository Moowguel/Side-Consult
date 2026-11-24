import { NextResponse, type NextRequest } from 'next/server'
import { verifySession, SESSION_COOKIE, type Role } from '@/lib/session'

// Controle de acesso centralizado por papel (RBAC). Roda antes de qualquer página/rota protegida.
const RULES: { prefix: string; roles: Role[]; login: string }[] = [
  { prefix: '/management', roles: ['GESTOR'], login: '/login/doctor' },
  { prefix: '/api/export', roles: ['GESTOR'], login: '/login/doctor' },
  { prefix: '/doctor-dashboard', roles: ['MEDICO', 'GESTOR'], login: '/login/doctor' },
  { prefix: '/portal', roles: ['CIDADAO', 'MEDICO', 'GESTOR'], login: '/login' },
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rule = RULES.find(r => pathname.startsWith(r.prefix))
  if (!rule) return NextResponse.next()

  const session = verifySession(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'não autenticado' }, { status: 401 })
    return NextResponse.redirect(new URL(rule.login, request.url))
  }
  if (!rule.roles.includes(session.role)) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'acesso negado' }, { status: 403 })
    const home = session.role === 'CIDADAO' ? '/portal' : '/doctor-dashboard'
    return NextResponse.redirect(new URL(home, request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/management/:path*', '/api/export/:path*', '/doctor-dashboard/:path*', '/portal/:path*'],
}
