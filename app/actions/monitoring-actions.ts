'use server'

import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { criticalVitals, personalAnomaly } from '@/lib/analytics'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const num = (v: FormDataEntryValue | null, min: number, max: number) => {
  const n = v ? parseInt(v as string) : NaN
  return Number.isFinite(n) && n >= min && n <= max ? n : null
}

export async function submitHealthRecord(formData: FormData) {
  const cookieStore = await cookies()
  const patientId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId
  if (!patientId) return { success: false, message: "Sessão expirada." }

  const systolic = num(formData.get('systolic'), 50, 260)
  const diastolic = num(formData.get('diastolic'), 30, 160)
  const glucose = num(formData.get('glucose'), 20, 600)
  const heartRate = num(formData.get('heartRate'), 20, 250)
  const spo2 = num(formData.get('spo2'), 50, 100)
  const notes = String(formData.get('notes') ?? '').slice(0, 500)

  if (!systolic && !glucose && !heartRate && !spo2) {
    return { success: false, message: "Preencha ao menos um sinal vital com valor válido." }
  }

  try {
    const history = await prisma.healthRecord.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' }, take: 30 })
    await prisma.healthRecord.create({ data: { patientId, systolic, diastolic, glucose, heartRate, spo2, notes } })
    revalidatePath('/portal/monitoring')

    const alerts = criticalVitals({ systolic, diastolic, glucose, heartRate, spo2 }).map(a => a.msg)
    if (systolic && systolic >= 140 && systolic < 180) alerts.push("Pressão alta. Monitore com frequência.")
    if (glucose && glucose >= 126 && glucose <= 300) alerts.push("Glicemia elevada (possível hiperglicemia).")
    if (glucose && glucose <= 70 && glucose >= 54) alerts.push("Hipoglicemia (açúcar baixo).")
    const sysAnomaly = systolic ? personalAnomaly(systolic, history.map(h => h.systolic).filter((x): x is number => x != null), 15) : null
    if (sysAnomaly && sysAnomaly.z > 0) alerts.push(`Sua pressão está bem diferente do seu normal (média ${sysAnomaly.baseline}).`)

    return { success: true, alert: alerts.join(' ') }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Erro ao salvar registro." }
  }
}
