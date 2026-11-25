import { createHmac, timingSafeEqual } from 'node:crypto'

// Sessão assinada (HMAC-SHA256). Antes o cookie guardava o ID do usuário em texto puro:
// bastava trocar o valor para "virar" outro paciente. Agora qualquer alteração invalida a assinatura.
export const SESSION_COOKIE = 'saude_session_id'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export type Role = 'CIDADAO' | 'MEDICO' | 'GESTOR'
export interface Session { userId: string; role: Role; exp: number }

function secret() {
  const s = process.env.SESSION_SECRET
  if (!s && process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET não configurado')
  return s || 'dev-only-secret-troque-em-producao'
}

const sign = (payload: string) => createHmac('sha256', secret()).update(payload).digest('base64url')

export function createSessionToken(userId: string, role: string): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, role, exp: Date.now() + SESSION_MAX_AGE * 1000 })
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function verifySession(token?: string | null): Session | null {
  if (!token) return null
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return null
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session
    return data.exp > Date.now() ? data : null
  } catch {
    return null
  }
}

export const isStaff = (role?: string) => role === 'MEDICO' || role === 'GESTOR'
