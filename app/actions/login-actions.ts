'use server'

import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session'

const HOME_BY_ROLE: Record<string, string> = {
  MEDICO: '/doctor-dashboard',
  GESTOR: '/management',
  CIDADAO: '/portal',
}

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = await prisma.user.findUnique({ where: { email } })

  // Mensagem única: não revela se o e-mail existe (evita enumeração de usuários).
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return { success: false, message: "E-mail ou senha inválidos." }
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, createSessionToken(user.id, user.role), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })

  return { success: true, redirectUrl: HOME_BY_ROLE[user.role] ?? '/portal' }
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
  redirect('/login')
}
