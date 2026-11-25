'use server'

import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE, isStaff } from '@/lib/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function requireStaff() {
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value)
  return session && isStaff(session.role) ? session : null
}

export async function startAttendance(triageId: string, patientId: string) {
  const session = await requireStaff()
  if (!session) return { success: false }

  try {
    const existingAppointment = await prisma.appointment.findUnique({ where: { triageId } })
    if (existingAppointment) return { success: true, appointmentId: existingAppointment.id }

    const appointment = await prisma.appointment.create({
      data: { date: new Date(), status: "EM_ANDAMENTO", triageId, patientId, doctorId: session.userId },
    })

    revalidatePath('/doctor-dashboard')
    return { success: true, appointmentId: appointment.id }
  } catch (error) {
    console.error("Erro ao iniciar atendimento:", error)
    return { success: false }
  }
}

// doctorSeverity: gravidade confirmada/corrigida pelo médico. Vira rótulo para re-treinar o modelo (ai:feedback).
export async function finishAttendance(appointmentId: string, diagnosis: string, doctorSeverity?: number) {
  const session = await requireStaff()
  if (!session) redirect('/login/doctor')

  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { diagnosis: diagnosis.slice(0, 5000), status: "CONCLUIDO" },
    })
    if (appointment.triageId && doctorSeverity && doctorSeverity >= 1 && doctorSeverity <= 5) {
      await prisma.triage.update({ where: { id: appointment.triageId }, data: { doctorSeverity } })
    }
    revalidatePath('/doctor-dashboard')
    revalidatePath('/doctor-dashboard/history')
  } catch (error) {
    console.error("Erro ao finalizar:", error)
    throw new Error("Erro ao salvar diagnóstico")
  }

  redirect('/doctor-dashboard')
}
