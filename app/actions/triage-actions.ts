'use server'

import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { type Symptom } from '@/lib/triageAlgorithm'
import { hybridTriage, suggestSpecialty } from '@/lib/ai/hybrid'
import { runSchedulingAgent } from '@/lib/ai/scheduling-agent'
import { SYMPTOMS } from '@/lib/ai/sideconsult-model'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function submitSmartTriage(
  symptoms: Symptom[],
  painLevel: number,
  userNotes: string,
  age?: number | null
) {
  // Validação na fronteira: nada que não seja sintoma conhecido ou número válido entra no modelo/banco.
  symptoms = symptoms.filter(s => (SYMPTOMS as readonly string[]).includes(s))
  painLevel = Math.min(10, Math.max(0, Math.round(Number(painLevel) || 0)))
  age = age != null && Number.isFinite(Number(age)) ? Math.min(120, Math.max(0, Math.round(Number(age)))) : null
  userNotes = String(userNotes ?? '').slice(0, 1000)
  if (symptoms.length === 0) return { success: false as const, message: 'Selecione ao menos um sintoma.' }

  try {
    const cookieStore = await cookies()
    const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId ?? null
    const user = sessionId ? await prisma.user.findUnique({ where: { id: sessionId } }) : null

    const patientId = user?.id ?? (await prisma.user.upsert({
      where: { email: 'visitante@saude.gov' },
      update: {},
      create: { email: 'visitante@saude.gov', name: 'Cidadão (Visitante)', role: 'CIDADAO', password: '!', cpf: '00000000000' },
    })).id

    if (age == null && user?.birthYear) age = new Date().getFullYear() - user.birthYear

    const result = hybridTriage({ symptoms, painLevel, age, notes: userNotes })
    const specialty = suggestSpecialty(symptoms)

    const triage = await prisma.triage.create({
      data: {
        patientId,
        symptoms: JSON.stringify(symptoms),
        severity: result.severity,
        notes: `Dor: ${painLevel}/10. Obs: ${userNotes}`,
        painLevel,
        age,
        region: user?.region,
        ruleSeverity: result.ruleSeverity,
        aiSeverity: result.aiSeverity,
        aiConfidence: result.aiConfidence,
        aiFactors: JSON.stringify(result.factors),
        specialty,
      },
    })

    const agent = await runSchedulingAgent({ triageId: triage.id, patientId: user ? user.id : null, severity: result.severity, symptoms, specialty })

    revalidatePath('/doctor-dashboard')
    revalidatePath('/portal/history')

    return {
      success: true as const,
      message: result.label,
      action: result.action,
      score: result.severity,
      isLoggedUser: !!user,
      ai: {
        ruleSeverity: result.ruleSeverity,
        aiSeverity: result.aiSeverity,
        confidence: result.aiConfidence,
        factors: result.factors,
        raisedByAI: result.raisedByAI,
      },
      agent: {
        steps: agent.steps,
        appointment: agent.appointment ? { ...agent.appointment, date: agent.appointment.date.toISOString() } : null,
        unit: agent.unit ?? null,
      },
    }
  } catch (error) {
    console.error('Erro na triagem:', error)
    return { success: false as const, message: 'Erro técnico.' }
  }
}
