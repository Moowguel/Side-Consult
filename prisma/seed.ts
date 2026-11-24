import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { hybridTriage, suggestSpecialty } from '../lib/ai/hybrid'

const prisma = new PrismaClient()

const REGIONS = ['Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste']

// Casos da fila do pronto-socorro (alguns com sinais de alerta só no relato, para a IA mostrar o ganho)
const QUEUE_CASES = [
  { symptoms: ['DOR_CABECA'], pain: 6, age: 71, notes: 'Comecou do nada, fala enrolada e boca torta' },
  { symptoms: ['DOR_TORACICA', 'FALTA_AR'], pain: 8, age: 58, notes: 'Dor irradia para o braco esquerdo com suor frio' },
  { symptoms: ['DIARREIA'], pain: 3, age: 34, notes: 'Hoje desmaiei no banheiro depois de vomitar' },
  { symptoms: ['FEBRE_ALTA', 'DOR_CABECA'], pain: 5, age: 22, notes: 'Febre de 39 ha dois dias, dor atras dos olhos' },
  { symptoms: ['FALTA_AR', 'FEBRE_ALTA'], pain: 4, age: 79, notes: 'Cansaco para subir escada, tosse' },
  { symptoms: ['DOR_GARGANTA'], pain: 2, age: 27, notes: 'Garganta arranhando desde ontem' },
  { symptoms: ['DOR_CABECA'], pain: 3, age: 40, notes: 'Enxaqueca de sempre, tomei dipirona' },
  { symptoms: ['FEBRE_ALTA'], pain: 4, age: 3, notes: 'Bebe nao para de chorar e esta molinho' },
]

async function main() {
  console.log('🌱 Iniciando o seed...')
  const passwordHash = await bcrypt.hash('123456', 10)

  const staff = [
    { email: 'gestor@saude.gov', name: 'Dr. Gestor Silva', role: 'GESTOR', crm: '99999/SP', specialty: 'Clínica Geral' },
    { email: 'medico@saude.gov', name: 'Dra. Ana Clínica', role: 'MEDICO', crm: '12345/SP', specialty: 'Clínica Geral' },
    { email: 'cardio@saude.gov', name: 'Dr. Paulo Coração', role: 'MEDICO', crm: '23456/SP', specialty: 'Cardiologia' },
    { email: 'pneumo@saude.gov', name: 'Dra. Lia Pulmão', role: 'MEDICO', crm: '34567/SP', specialty: 'Pneumologia' },
    { email: 'infecto@saude.gov', name: 'Dr. Rui Infecto', role: 'MEDICO', crm: '45678/SP', specialty: 'Infectologia' },
  ]
  for (const s of staff) {
    await prisma.user.upsert({ where: { email: s.email }, update: { role: s.role, specialty: s.specialty }, create: { ...s, password: passwordHash } })
  }
  const gestor = await prisma.user.findUniqueOrThrow({ where: { email: 'gestor@saude.gov' } })
  console.log('👨‍⚕️ Gestor e médicos criados.')

  const units = [
    { name: 'Hospital Municipal Central', address: 'Av. Paulista, 1578 - Bela Vista, São Paulo', type: 'HOSPITAL', phone: '(11) 3222-0000' },
    { name: 'UBS Vila Mariana', address: 'Rua Dr. Diogo de Faria, 100 - Vila Mariana, São Paulo', type: 'UBS', phone: '(11) 5555-1234' },
    { name: 'UPA 24h Zona Sul', address: 'Av. Santo Amaro, 5000 - Brooklin, São Paulo', type: 'UPA', phone: '(11) 5555-9999' },
    { name: 'Farmácia Popular do Centro', address: 'Praça da Sé, 10 - Centro, São Paulo', type: 'FARMACIA', phone: '(11) 3100-5000' },
    { name: 'Hospital Infantil Sabará', address: 'Av. Angélica, 1987 - Higienópolis, São Paulo', type: 'HOSPITAL', phone: '(11) 3155-2000' },
  ]
  for (const unit of units) {
    if (!(await prisma.healthUnit.findFirst({ where: { name: unit.name } }))) {
      await prisma.healthUnit.create({ data: { ...unit, creatorId: gestor.id } })
    }
  }

  // Paciente de demonstração: Maria, 68 anos, hipertensa, com wearable IoT vinculado
  const thisYear = new Date().getFullYear()
  const maria = await prisma.user.upsert({
    where: { email: 'maria@teste.com' },
    update: {},
    create: { email: 'maria@teste.com', name: 'Maria Aparecida', cpf: '98765432100', role: 'CIDADAO', password: passwordHash, birthYear: thisYear - 68, region: 'Zona Leste', consentAt: new Date() },
  })
  await prisma.device.upsert({
    where: { token: 'demo-wearable-token' },
    update: { patientId: maria.id },
    create: { name: 'Wearable SideBand #001', token: 'demo-wearable-token', patientId: maria.id },
  })
  if ((await prisma.healthRecord.count({ where: { patientId: maria.id } })) === 0) {
    for (let d = 14; d >= 1; d--) {
      const date = new Date(); date.setDate(date.getDate() - d); date.setHours(8, 0, 0, 0)
      const systolic = Math.round(124 + (14 - d) * 0.9 + (Math.random() - 0.5) * 6)
      await prisma.healthRecord.create({
        data: { patientId: maria.id, systolic, diastolic: Math.round(systolic * 0.64), glucose: Math.round(98 + Math.random() * 14), heartRate: Math.round(70 + Math.random() * 8), spo2: 97, createdAt: date, notes: 'Medição matinal' },
      })
    }
  }
  await prisma.vaccine.deleteMany({ where: { userId: maria.id } })
  await prisma.vaccine.createMany({ data: [
    { userId: maria.id, name: 'Influenza (Gripe)', dose: 'Dose Anual', date: new Date(`${thisYear}-04-20`), status: 'PENDENTE', location: 'Campanha Nacional' },
    { userId: maria.id, name: 'Covid-19', dose: 'Reforço', batch: 'PF2026', date: new Date(`${thisYear}-03-10`), status: 'APLICADA', location: 'UBS Vila Mariana' },
  ] })

  console.log('🤒 Gerando pacientes, triagens (com IA) e vacinas...')
  for (let i = 0; i < 30; i++) {
    const age = 5 + ((i * 37) % 85)
    const patient = await prisma.user.upsert({
      where: { email: `paciente_v2_${i}@teste.com` },
      update: {},
      create: {
        email: `paciente_v2_${i}@teste.com`, name: `Paciente Teste ${i}`, cpf: `123456789${String(i).padStart(2, '0')}`,
        role: 'CIDADAO', password: passwordHash, birthYear: thisYear - age, region: REGIONS[i % REGIONS.length], consentAt: new Date(),
      },
    })

    if (i < QUEUE_CASES.length && (await prisma.triage.count({ where: { patientId: patient.id } })) === 0) {
      const c = QUEUE_CASES[i]
      const r = hybridTriage({ symptoms: c.symptoms, painLevel: c.pain, age: c.age, notes: c.notes })
      const date = new Date(); date.setMinutes(date.getMinutes() - (i + 1) * 17)
      await prisma.triage.create({
        data: {
          patientId: patient.id, symptoms: JSON.stringify(c.symptoms), severity: r.severity, createdAt: date,
          notes: `Dor: ${c.pain}/10. Obs: ${c.notes}`, painLevel: c.pain, age: c.age, region: patient.region,
          ruleSeverity: r.ruleSeverity, aiSeverity: r.aiSeverity, aiConfidence: r.aiConfidence,
          aiFactors: JSON.stringify(r.factors), specialty: suggestSpecialty(c.symptoms),
        },
      })
    }

    if ((await prisma.vaccine.count({ where: { userId: patient.id } })) === 0) {
      await prisma.vaccine.createMany({ data: [
        { userId: patient.id, name: 'Covid-19 (Pfizer)', dose: 'Reforço Bivalente', batch: `PF${i}2024`, date: new Date('2024-05-10'), status: 'APLICADA', location: 'UBS Vila Mariana' },
        { userId: patient.id, name: 'Influenza (Gripe)', dose: `Dose Anual ${thisYear}`, date: new Date(`${thisYear}-04-20`), status: 'PENDENTE', location: 'Campanha Nacional' },
      ] })
    }
  }

  // Histórico de atendimentos já concluídos e revisados pelo médico (alimenta "Concordância IA × médico",
  // "Espera média" e o ciclo de re-treino `npm run ai:feedback`).
  const medico = await prisma.user.findUniqueOrThrow({ where: { email: 'medico@saude.gov' } })
  if ((await prisma.triage.count({ where: { doctorSeverity: { not: null }, source: 'APP' } })) === 0) {
    const DIAGNOSES = ['Virose, repouso e hidratação.', 'Faringite, sintomáticos.', 'Crise hipertensiva, ajuste de medicação.', 'Suspeita de dengue, hidratação e exames.', 'Gastroenterite, soro oral.', 'Enxaqueca, analgesia.']
    const PAST_CASES = [...QUEUE_CASES,
      { symptoms: ['FEBRE_ALTA', 'DOR_CABECA'], pain: 6, age: 45, notes: 'Febre e dor atras dos olhos, manchas na pele' },
      { symptoms: ['DOR_GARGANTA', 'FEBRE_ALTA'], pain: 4, age: 19, notes: 'Placas na garganta' },
      { symptoms: ['DIARREIA'], pain: 2, age: 81, notes: 'Urina muito pouca e boca seca' },
    ]
    for (let k = 0; k < 40; k++) {
      const patient = await prisma.user.findUniqueOrThrow({ where: { email: `paciente_v2_${k % 30}@teste.com` } })
      const c = PAST_CASES[k % PAST_CASES.length]
      const r = hybridTriage({ symptoms: c.symptoms, painLevel: c.pain, age: c.age, notes: c.notes })
      const createdAt = new Date(); createdAt.setDate(createdAt.getDate() - 1 - (k % 25)); createdAt.setHours(8 + (k % 10), (k * 7) % 60)
      const attendedAt = new Date(createdAt.getTime() + (r.severity >= 4 ? 8 + (k % 10) : 30 + ((k * 13) % 90)) * 60_000)
      // O médico concorda na maioria dos casos; em alguns corrige 1 nível (vira rótulo de re-treino)
      const doctorSeverity = k % 6 === 5 ? Math.max(1, r.severity - 1) : r.severity
      const triage = await prisma.triage.create({
        data: {
          patientId: patient.id, symptoms: JSON.stringify(c.symptoms), severity: r.severity, createdAt,
          notes: `Dor: ${c.pain}/10. Obs: ${c.notes}`, painLevel: c.pain, age: c.age, region: patient.region,
          ruleSeverity: r.ruleSeverity, aiSeverity: r.aiSeverity, aiConfidence: r.aiConfidence,
          aiFactors: JSON.stringify(r.factors), specialty: suggestSpecialty(c.symptoms), doctorSeverity,
        },
      })
      await prisma.appointment.create({
        data: { date: attendedAt, status: 'CONCLUIDO', triageId: triage.id, patientId: patient.id, doctorId: medico.id, diagnosis: DIAGNOSES[k % DIAGNOSES.length] },
      })
    }
  }

  console.log('✅ Seed concluído. Rode `npm run data:pipeline` para carregar o histórico epidemiológico.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
