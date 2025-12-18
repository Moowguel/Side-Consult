'use server'

import { PrismaClient } from '@prisma/client'
import { calculateTriagePriority, Symptom } from '@/lib/triageAlgorithm'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function submitSmartTriage(
  symptoms: Symptom[], 
  painLevel: number, 
  userNotes: string
) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('saude_session_id')?.value
    let patientId = sessionId

    if (!patientId) {
       const guestUser = await prisma.user.upsert({
        where: { email: 'visitante@saude.gov' },
        update: {}, 
        create: {
          email: 'visitante@saude.gov',
          name: 'Cidadão (Visitante)',
          role: 'CIDADAO',
          password: '$2b$10$placeholder_safe_hash', 
          cpf: '00000000000'
        }
      })
      patientId = guestUser.id
    }

    const analysis = calculateTriagePriority(symptoms)
    
    let finalScore = analysis.score
    if (painLevel >= 8 && finalScore < 4) finalScore = 4;
    if (painLevel === 10) finalScore = 5;

    // Salva no banco
    await prisma.triage.create({
      data: {
        patientId: patientId!,
        symptoms: JSON.stringify(symptoms),
        severity: finalScore,
        notes: `Dor: ${painLevel}/10. Obs: ${userNotes}` 
      }
    })

    revalidatePath('/doctor-dashboard')

    return {
      success: true,
      message: finalScore >= 5 ? "EMERGÊNCIA MÉDICA" : analysis.priorityLabel,
      action: analysis.recommendedAction,
      score: finalScore,
      isLoggedUser: !!sessionId
    }

  } catch (error) {
    console.error("Erro na triagem:", error)
    return { success: false, message: "Erro técnico." }
  }
}