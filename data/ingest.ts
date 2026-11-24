// Pipeline de ingestão (camadas do data lake): data/raw (bruto) -> limpeza/padronização -> data/processed (confiável) -> banco.
// Etapas: parse -> validação -> normalização (datas, regiões, sintomas) -> deduplicação -> carga + relatório de qualidade.
// Uso: npx tsx data/ingest.ts   (idempotente: recarrega os registros importados a cada execução)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const REGIONS: Record<string, string> = {
  'centro': 'Centro', 'zona norte': 'Zona Norte', 'z. norte': 'Zona Norte', 'zn': 'Zona Norte',
  'zona sul': 'Zona Sul', 'z. sul': 'Zona Sul', 'zs': 'Zona Sul', 'zona leste': 'Zona Leste', 'z. leste': 'Zona Leste', 'zl': 'Zona Leste',
  'zona oeste': 'Zona Oeste', 'z. oeste': 'Zona Oeste', 'zo': 'Zona Oeste',
}
const SYMPTOMS: Record<string, string> = {
  'febre alta': 'FEBRE_ALTA', 'dor no peito': 'DOR_TORACICA', 'falta de ar': 'FALTA_AR',
  'dor de cabeca': 'DOR_CABECA', 'dor de garganta': 'DOR_GARGANTA', 'diarreia': 'DIARREIA',
}

export interface CleanRow { date: Date; region: string; unit: string; symptoms: string[]; age: number | null; pain: number; severity: number }

export function cleanRow(line: string): { row?: CleanRow; error?: string } {
  const cols = line.split(';')
  if (cols.length !== 7) return { error: 'colunas inválidas' }
  const [dateStr, regionRaw, unit, symptomsRaw, ageRaw, painRaw, sevRaw] = cols
  const m = dateStr.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return { error: 'data ausente/formato inválido' }
  const date = new Date(+m[3], +m[2] - 1, +m[1], 12)
  if (date.getDate() !== +m[1]) return { error: 'data inexistente' }
  const region = REGIONS[strip(regionRaw)]
  if (!region) return { error: 'região desconhecida' }
  const symptoms = symptomsRaw.split('|').map(s => SYMPTOMS[strip(s)]).filter(Boolean)
  if (!symptoms.length) return { error: 'sem sintomas reconhecidos' }
  const severity = Number(sevRaw)
  if (!(severity >= 1 && severity <= 5)) return { error: 'gravidade fora de 1-5' }
  const age = ageRaw.trim() === '' ? null : Math.min(120, Math.max(0, Number(ageRaw)))
  const pain = Math.min(10, Math.max(0, Number(painRaw) || 0))
  return { row: { date, region, unit: unit.trim(), symptoms, age, pain, severity } }
}

async function main() {
  const files = readdirSync('data/raw').filter(f => f.endsWith('.csv'))
  const seen = new Set<string>()
  const clean: CleanRow[] = []
  const errors: Record<string, number> = {}
  let read = 0, duplicates = 0

  for (const file of files) {
    for (const line of readFileSync(`data/raw/${file}`, 'utf8').split(/\r?\n/).slice(1)) {
      if (!line.trim()) continue
      read++
      const hash = createHash('sha1').update(line).digest('hex')
      if (seen.has(hash)) { duplicates++; continue }
      seen.add(hash)
      const { row, error } = cleanRow(line)
      if (error) errors[error] = (errors[error] ?? 0) + 1
      else clean.push(row!)
    }
  }

  // Camada "processed": dado padronizado, pronto para BI
  mkdirSync('data/processed', { recursive: true })
  writeFileSync('data/processed/triagens_padronizadas.csv', ['data,regiao,unidade,sintomas,idade,dor,gravidade',
    ...clean.map(r => `${r.date.toISOString().slice(0, 10)},${r.region},${r.unit},${r.symptoms.join('|')},${r.age ?? ''},${r.pain},${r.severity}`)].join('\n') + '\n')
  const report = { executadoEm: new Date().toISOString(), arquivos: files, linhasLidas: read, duplicadasRemovidas: duplicates,
    descartadas: Object.values(errors).reduce((a, b) => a + b, 0), motivosDescarte: errors, carregadas: clean.length }
  writeFileSync('data/processed/quality_report.json', JSON.stringify(report, null, 2))

  // Carga no banco (registros anonimizados: um paciente técnico por região, sem dados pessoais)
  await prisma.triage.deleteMany({ where: { source: 'IMPORT' } })
  const patients = new Map<string, string>()
  for (const region of new Set(clean.map(r => r.region))) {
    const email = `importacao.${strip(region).replace(/\s/g, '-')}@saude.gov`
    const p = await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: `Registro anonimizado (${region})`, password: '!', role: 'CIDADAO', region } })
    patients.set(region, p.id)
  }
  for (let i = 0; i < clean.length; i += 500) {
    await prisma.triage.createMany({
      data: clean.slice(i, i + 500).map(r => ({
        patientId: patients.get(r.region)!, symptoms: JSON.stringify(r.symptoms), severity: r.severity, ruleSeverity: r.severity,
        painLevel: r.pain, age: r.age, region: r.region, source: 'IMPORT', createdAt: r.date, notes: `Importado de ${r.unit}`,
      })),
    })
  }
  console.table(report.motivosDescarte)
  console.log(`✅ Ingestão: ${read} lidas, ${duplicates} duplicadas, ${report.descartadas} descartadas, ${clean.length} carregadas`)
}

if (require.main === module) main().finally(() => prisma.$disconnect())
