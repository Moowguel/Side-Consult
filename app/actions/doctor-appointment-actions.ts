'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { verifySession, SESSION_COOKIE, isStaff } from '@/lib/session'


export async function manageAppointment(appointmentId: string, action: 'CONFIRMAR' | 'RECUSAR') {
  
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session || !isStaff(session.role)) return { success: false, message: "Não autorizado." }

  const newStatus = action === 'CONFIRMAR' ? 'AGENDADO' : 'RECUSADO';

  try {

    
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: newStatus },
      include: { patient: true } 
    })

    if (action === 'CONFIRMAR' && appointment.type === 'VACINA' && appointment.vaccineName) {
        
        await prisma.vaccine.create({
            data: {
                userId: appointment.patientId,
                name: appointment.vaccineName,
                dose: "Dose Agendada",
                date: appointment.date, 
                status: "PENDENTE",     
                location: "Consultório Médico" 
            }
        })
    }

    revalidatePath('/doctor-dashboard')
    revalidatePath('/portal/vaccines') 
    return { success: true }

  } catch (error) {
    console.error(error)
    return { success: false, message: "Erro ao atualizar." }
  }
}