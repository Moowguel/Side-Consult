'use server'

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers' 
import { redirect } from 'next/navigation'

const prisma = new PrismaClient()

export async function loginUser(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return { success: false, message: "E-mail não encontrado." }
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    return { success: false, message: "Senha incorreta." }
  }

  const cookieStore = await cookies() 
  
  cookieStore.set('saude_session_id', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, 
    path: '/',
  })

  const destination = user.role === 'MEDICO' ? '/doctor-dashboard' : '/portal';
  return { success: true, redirectUrl: destination }
}

export async function logout() {
  const cookieStore = await cookies() 
  cookieStore.delete('saude_session_id')
  redirect('/login')
}