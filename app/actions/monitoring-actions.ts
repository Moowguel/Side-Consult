'use server'

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function submitHealthRecord(formData: FormData) {
  const cookieStore = await cookies()
  const patientId = cookieStore.get('saude_session_id')?.value

  if (!patientId) return { success: false, message: "Sessão expirada." }

  const systolic = formData.get('systolic') ? parseInt(formData.get('systolic') as string) : null
  const diastolic = formData.get('diastolic') ? parseInt(formData.get('diastolic') as string) : null
  const glucose = formData.get('glucose') ? parseInt(formData.get('glucose') as string) : null
  const notes = formData.get('notes') as string

  if (!systolic && !glucose) {
    return { success: false, message: "Preencha pelo menos a Pressão ou a Glicose." }
  }

  try {
    await prisma.healthRecord.create({
      data: {
        patientId,
        systolic,
        diastolic,
        glucose,
        notes
      }
    })

    revalidatePath('/portal/monitoring')


    let alertMessage = ""
    if (systolic && systolic >= 140) alertMessage = "Atenção: Sua pressão está alta. Monitore com frequência."
    if (glucose && glucose >= 126) alertMessage = "Atenção: Glicemia elevada (possível hiperglicemia)."
    if (glucose && glucose <= 70) alertMessage = "Cuidado: Hipoglicemia (açúcar baixo)."

    return { success: true, alert: alertMessage }

  } catch (error) {
    console.error(error)
    return { success: false, message: "Erro ao salvar registro." }
  }
}