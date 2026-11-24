import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { criticalVitals, personalAnomaly, VITAL_RULES } from '@/lib/analytics'
import { revalidatePath } from 'next/cache'

// Ingestão de leituras de dispositivos IoT (ESP32/Wokwi ou iot/simulator.ts).
// Autenticação por token do dispositivo (header x-device-token), validação de faixa fisiológica,
// detecção de anomalia (limite clínico + linha de base do próprio paciente) e alerta automático na fila do médico.

const RANGES = {
  systolic: [50, 260], diastolic: [30, 160], glucose: [20, 600], heartRate: [20, 250], spo2: [50, 100],
} as const
type Field = keyof typeof RANGES

export async function POST(request: NextRequest) {
  const token = request.headers.get('x-device-token')
  const device = token ? await prisma.device.findUnique({ where: { token } }) : null
  if (!device) return NextResponse.json({ error: 'dispositivo não autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const reading: Partial<Record<Field, number>> = {}
  for (const [field, [min, max]] of Object.entries(RANGES) as [Field, readonly [number, number]][]) {
    const v = body[field]
    if (v == null) continue
    const n = Number(v)
    if (!Number.isFinite(n) || n < min || n > max) {
      return NextResponse.json({ error: `${field} fora da faixa (${min}-${max})` }, { status: 422 })
    }
    reading[field] = Math.round(n)
  }
  if (Object.keys(reading).length === 0) return NextResponse.json({ error: 'nenhuma leitura enviada' }, { status: 422 })

  // Linha de base = estado habitual do paciente (leituras com mais de 30 min). Leituras dos últimos minutos
  // podem já fazer parte da piora e "normalizariam" a crise se entrassem na média.
  const history = await prisma.healthRecord.findMany({
    where: { patientId: device.patientId, createdAt: { lt: new Date(Date.now() - 30 * 60_000) } }, orderBy: { createdAt: 'desc' }, take: 30,
  })

  const record = await prisma.healthRecord.create({
    data: { ...reading, patientId: device.patientId, deviceId: device.id, source: 'DEVICE', notes: `Leitura automática: ${device.name}` },
  })
  await prisma.device.update({ where: { id: device.id }, data: { lastSeen: new Date() } })

  const alerts = criticalVitals(reading)
  if (alerts.length === 0) {
    for (const [field, rule] of Object.entries(VITAL_RULES) as [keyof typeof VITAL_RULES, (typeof VITAL_RULES)[keyof typeof VITAL_RULES]][]) {
      const v = reading[field]
      if (v == null) continue
      const anomaly = personalAnomaly(v, history.map(h => h[field]).filter((x): x is number => x != null), rule.minDelta)
      if (anomaly && Math.sign(anomaly.z) === rule.worse) {
        alerts.push({ msg: `${rule.label} ${v} fora do padrão do paciente (média ${anomaly.baseline})`, severity: 3 })
      }
    }
  }

  let triageId: string | null = null
  if (alerts.length) {
    const severity = Math.max(...alerts.map(a => a.severity))
    // Evita alertas duplicados: se já existe um alerta IoT aberto recente, apenas eleva a gravidade.
    const open = await prisma.triage.findFirst({
      where: { patientId: device.patientId, source: 'IOT', appointment: null, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } },
    })
    const notes = `📡 Alerta automático (${device.name}): ${alerts.map(a => a.msg).join('; ')}`
    const triage = open
      ? await prisma.triage.update({ where: { id: open.id }, data: { severity: Math.max(open.severity, severity), notes } })
      : await prisma.triage.create({
          data: { patientId: device.patientId, symptoms: '[]', severity, notes, source: 'IOT', ruleSeverity: severity },
        })
    triageId = triage.id
    revalidatePath('/doctor-dashboard')
  }
  revalidatePath('/portal/monitoring')

  return NextResponse.json({ ok: true, recordId: record.id, alerts, triageId }, { status: 201 })
}
