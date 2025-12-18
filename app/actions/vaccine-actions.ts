'use server'

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

export async function getVaccines() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('saude_session_id')?.value
  
  if (!sessionId) return []

  return await prisma.vaccine.findMany({
    where: { userId: sessionId },
    orderBy: { date: 'desc' }
  })
}