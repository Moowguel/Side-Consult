// Ciclo de aprendizado: exporta as triagens cuja gravidade foi confirmada/corrigida por um médico
// para ai/data/feedback.csv. O próximo `npm run ai:train` incorpora esses rótulos reais.
import { writeFileSync, mkdirSync } from 'node:fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const rows = await prisma.triage.findMany({ where: { doctorSeverity: { not: null }, source: 'APP' } })
  const csv = ['symptoms,pain_level,age,notes,severity', ...rows.map(t => {
    const symptoms = (JSON.parse(t.symptoms) as string[]).join(';')
    const notes = (t.notes ?? '').replace(/^Dor: \d+\/10\. Obs: /, '').replace(/["\r\n]/g, ' ')
    return `${symptoms},${t.painLevel ?? 0},${t.age ?? 40},"${notes}",${t.doctorSeverity}`
  })]
  mkdirSync('ai/data', { recursive: true })
  writeFileSync('ai/data/feedback.csv', csv.join('\n') + '\n')
  const corrected = rows.filter(t => t.doctorSeverity !== t.severity).length
  console.log(`✅ ${rows.length} rótulos médicos exportados (${corrected} correções da IA). Rode: npm run ai:train`)
}

main().finally(() => prisma.$disconnect())
