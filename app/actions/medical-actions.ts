'use server'

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function startAttendance(triageId: string, patientId: string) {
  const cookieStore = await cookies()
  const doctorId = cookieStore.get('saude_session_id')?.value

  if (!doctorId) return { success: false }

  try {
    const existingAppointment = await prisma.appointment.findUnique({
        where: { triageId: triageId }
    })

    if (existingAppointment) {
        return { success: true, appointmentId: existingAppointment.id }
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: new Date(),
        status: "EM_ANDAMENTO",
        triageId: triageId,
        patientId: patientId,
        doctorId: doctorId
      }
    })

    revalidatePath('/doctor-dashboard') 
    return { success: true, appointmentId: appointment.id }

  } catch (error) {
    console.error("Erro ao iniciar atendimento:", error)
    return { success: false }
  }
}


export async function finishAttendance(appointmentId: string, diagnosis: string) {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        diagnosis: diagnosis,
        status: "CONCLUIDO"
      }
    })

    
    revalidatePath('/doctor-dashboard')
    revalidatePath('/doctor-dashboard/history') 

  } catch (error) {
    console.error("Erro ao finalizar:", error)
    throw new Error("Erro ao salvar diagnóstico")
  }

  redirect('/doctor-dashboard')
}