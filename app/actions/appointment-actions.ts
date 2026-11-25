'use server'

import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'



export async function getDoctors() {
  return await prisma.user.findMany({
    where: { role: { in: ['MEDICO', 'GESTOR'] } },
    select: { id: true, name: true, specialty: true, crm: true }
  })
}

export async function scheduleAppointment(
    doctorId: string, 
    dateString: string, 
    type: string = 'CONSULTA',       
    vaccineName: string | null = null, 
    modality: string = 'PRESENCIAL'    
) {
  const cookieStore = await cookies()
  const patientId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId

  if (!patientId) {
      return { success: false, message: "Você precisa estar logado para agendar." }
  }

  const appointmentDate = new Date(dateString)

  try {

    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId: doctorId,
        date: appointmentDate,
        status: { not: 'CANCELADO' } 
      }
    })

    if (conflict) {
      return { success: false, message: "Este horário não está mais disponível." }
    }

    await prisma.appointment.create({
      data: {
        date: appointmentDate,
        patientId: patientId,
        doctorId: doctorId,
        status: "PENDENTE",
        type: type,
        vaccineName: vaccineName,
        modality: modality
      }
    })

    revalidatePath('/portal')
    revalidatePath('/portal/history')
    
    return { success: true }

  } catch (error) {
    console.error("Erro no agendamento:", error)
    return { success: false, message: "Erro técnico ao realizar agendamento." }
  }
}