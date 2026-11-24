'use server'

import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { cookies } from 'next/headers'


export async function getVaccines() {
  const cookieStore = await cookies()
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId
  
  if (!sessionId) return []

  return await prisma.vaccine.findMany({
    where: { userId: sessionId },
    orderBy: { date: 'desc' }
  })
}