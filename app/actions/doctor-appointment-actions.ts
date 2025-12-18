'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function manageAppointment(appointmentId: string, action: 'CONFIRMAR' | 'RECUSAR') {
  
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