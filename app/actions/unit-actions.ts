'use server'

import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE, isStaff } from '@/lib/session'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'



export async function getHealthUnits() {
  return await prisma.healthUnit.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createHealthUnit(formData: FormData) {
  const cookieStore = await cookies()
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId

  if (!sessionId) return { success: false, message: "Não autorizado." }

  const user = await prisma.user.findUnique({ where: { id: sessionId }})
  if (!user || !isStaff(user.role)) {
    return { success: false, message: "Apenas médicos podem cadastrar unidades." }
  }

  const name = formData.get('name') as string
  const address = formData.get('address') as string
  const type = formData.get('type') as string
  const phone = formData.get('phone') as string

  try {
    await prisma.healthUnit.create({
      data: {
        name,
        address,
        type,
        phone,
        creatorId: user.id
      }
    })

    revalidatePath('/portal/units')
    return { success: true }

  } catch (error) {
    console.error(error)
    return { success: false, message: "Erro ao cadastrar." }
  }
}