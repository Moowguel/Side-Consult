import { prisma } from '../prisma'

// Agente de agendamento: percebe o resultado da triagem, decide o destino e age (cria a consulta).
// Cada passo fica registrado em `steps` para ser exibido ao cidadão: a decisão é transparente.

const REMOTE_OK = new Set(['DOR_GARGANTA', 'DOR_CABECA', 'FEBRE_ALTA', 'DIARREIA'])

export interface AgentResult {
  steps: string[]
  appointment?: { id: string; date: Date; doctorName: string; modality: string }
  unit?: { name: string; address: string }
}

async function firstFreeSlot(doctorId: string, from: Date, sameDay: boolean): Promise<Date | null> {
  const busy = await prisma.appointment.findMany({
    where: { doctorId, status: { notIn: ['CANCELADO', 'RECUSADO'] }, date: { gte: from } },
    select: { date: true },
  })
  const taken = new Set(busy.map(b => b.date.getTime()))
  const slot = new Date(from)
  slot.setMinutes(0, 0, 0)
  slot.setHours(slot.getHours() + 1)
  for (let i = 0; i < 24 * 7; i++, slot.setHours(slot.getHours() + 1)) {
    const h = slot.getHours(), d = slot.getDay()
    if (sameDay && slot.getDate() !== from.getDate()) return null
    if (d === 0 || d === 6 || h < 8 || h >= 18) continue
    if (!taken.has(slot.getTime())) return new Date(slot)
  }
  return null
}

export async function runSchedulingAgent(params: {
  triageId: string
  patientId: string | null
  severity: number
  symptoms: string[]
  specialty: string
}): Promise<AgentResult> {
  const { severity, symptoms, specialty } = params
  const steps = [`Recebi a triagem com gravidade ${severity}/5 e especialidade sugerida: ${specialty}.`]

  if (severity >= 4) {
    const unit = await prisma.healthUnit.findFirst({ where: { type: { in: ['UPA', 'HOSPITAL'] } }, orderBy: { type: 'desc' } })
    steps.push('Gravidade alta: não é caso de agendamento. Coloquei você no topo da fila do pronto-socorro.')
    if (unit) steps.push(`Unidade de referência mais indicada: ${unit.name}.`)
    return { steps, unit: unit ? { name: unit.name, address: unit.address } : undefined }
  }

  if (!params.patientId) {
    steps.push('Você não está logado. Entre no portal para que eu agende a consulta automaticamente.')
    return { steps }
  }

  const doctors = await prisma.user.findMany({
    where: { role: { in: ['MEDICO', 'GESTOR'] } },
    include: { _count: { select: { doctorAppointments: { where: { status: { in: ['PENDENTE', 'AGENDADO'] } } } } } },
  })
  // Médicos assistenciais têm preferência; o gestor só atende se não houver outro disponível.
  const medicos = doctors.filter(d => d.role === 'MEDICO')
  const candidates = medicos.filter(d => d.specialty === specialty)
  const pool = candidates.length ? candidates : medicos.filter(d => d.specialty === 'Clínica Geral')
  const finalPool = pool.length ? pool : doctors
  if (!finalPool.length) {
    steps.push('Nenhum médico disponível no momento. A triagem ficou registrada para a equipe.')
    return { steps }
  }
  if (!candidates.length) steps.push(`Sem médico de ${specialty} disponível; direcionei para Clínica Geral.`)

  const doctor = [...finalPool].sort((a, b) => a._count.doctorAppointments - b._count.doctorAppointments)[0]
  steps.push(`Escolhi ${doctor.name} por ter a menor fila (${doctor._count.doctorAppointments} pendentes).`)

  const sameDay = severity === 3
  const date = (sameDay ? await firstFreeSlot(doctor.id, new Date(), true) : null)
    ?? await firstFreeSlot(doctor.id, new Date(), false)
  if (!date) {
    steps.push('Agenda cheia nos próximos 7 dias. A equipe vai entrar em contato.')
    return { steps }
  }
  const modality = severity <= 2 && symptoms.every(s => REMOTE_OK.has(s)) ? 'TELEMEDICINA' : 'PRESENCIAL'
  steps.push(sameDay ? 'Urgente: procurei encaixe ainda hoje.' : 'Não urgente: procurei o primeiro horário livre em dia útil.')
  steps.push(modality === 'TELEMEDICINA'
    ? 'Sintomas leves e compatíveis com atendimento remoto: marquei por telemedicina (evita deslocamento).'
    : 'Marquei atendimento presencial.')

  const appointment = await prisma.appointment.create({
    data: { date, patientId: params.patientId, doctorId: doctor.id, triageId: params.triageId, status: 'PENDENTE', type: 'CONSULTA', modality },
  })
  steps.push('Consulta criada e enviada para confirmação do médico.')
  return { steps, appointment: { id: appointment.id, date, doctorName: doctor.name, modality } }
}
