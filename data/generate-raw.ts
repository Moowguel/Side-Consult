// Simula a exportação de atendimentos das UBS da rede (fonte externa, formato "sujo" como na vida real):
// separador ";", datas dd/mm/aaaa, regiões escritas de vários jeitos, sintomas em texto, idades faltando,
// linhas duplicadas e registros inválidos. Inclui um surto de febre na Zona Leste nos últimos dias.
// Uso: npx tsx data/generate-raw.ts [dias=90]
import { writeFileSync, mkdirSync } from 'node:fs'

let seed = 2026
const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const pick = <T,>(a: T[]) => a[Math.floor(rand() * a.length)]

const REGION_SPELLINGS: Record<string, string[]> = {
  'Centro': ['Centro', 'CENTRO', 'centro '],
  'Zona Norte': ['Zona Norte', 'zona norte', 'Z. Norte', 'ZN'],
  'Zona Sul': ['Zona Sul', 'ZONA SUL', 'Z. Sul', 'ZS'],
  'Zona Leste': ['Zona Leste', 'zona leste', 'Z. Leste', 'ZL'],
  'Zona Oeste': ['Zona Oeste', 'Z. Oeste', 'ZO'],
}
const UNITS = ['UBS Vila Mariana', 'UPA 24h Zona Sul', 'Hospital Municipal Central', 'UBS Itaquera', 'UBS Santana']
const SYMPTOM_TEXT = ['febre alta', 'dor no peito', 'falta de ar', 'dor de cabeca', 'dor de garganta', 'diarreia']
const sevFor = (s: string[]) => s.includes('dor no peito') ? 5 : s.includes('falta de ar') ? 4 : s.includes('febre alta') ? 3 : pick([1, 1, 2])

const days = Number(process.argv[2] ?? 90)
const rows: string[] = ['data_atendimento;regiao;unidade;sintomas;idade;dor;gravidade']
const today = new Date()
for (let d = days - 1; d >= 0; d--) {
  const date = new Date(today); date.setDate(today.getDate() - d)
  const weekend = date.getDay() === 0 || date.getDay() === 6
  for (const region of Object.keys(REGION_SPELLINGS)) {
    const outbreak = region === 'Zona Leste' && d <= 3
    const n = Math.round((weekend ? 3 : 6) * (0.6 + rand() * 0.8)) + (outbreak ? 14 + Math.round(rand() * 6) : 0)
    for (let i = 0; i < n; i++) {
      const symptoms = outbreak && rand() < 0.8
        ? ['febre alta', pick(['dor de cabeca', 'dor de cabeca', 'diarreia'])]
        : [...new Set([pick(SYMPTOM_TEXT), ...(rand() < 0.4 ? [pick(SYMPTOM_TEXT)] : [])])]
      const dateStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
      const age = rand() < 0.08 ? '' : String(Math.floor(rand() * 90))
      const row = `${dateStr};${pick(REGION_SPELLINGS[region])};${pick(UNITS)};${symptoms.join(' | ')};${age};${Math.floor(rand() * 11)};${sevFor(symptoms)}`
      rows.push(row)
      if (rand() < 0.03) rows.push(row) // duplicata (reenvio do sistema da UBS)
    }
  }
}
// Registros inválidos que a ingestão deve descartar
rows.push(';Zona Sul;UBS Santana;febre alta;30;5;3', '31/02/2026;Centro;UBS Santana;dor de cabeca;40;2;1', '10/10/2026;Marte;UBS X;febre alta;30;5;3', '10/10/2026;Centro;UBS Santana;;30;5;9')

mkdirSync('data/raw', { recursive: true })
writeFileSync('data/raw/atendimentos_ubs.csv', rows.join('\n') + '\n')
console.log(`✅ data/raw/atendimentos_ubs.csv: ${rows.length - 1} linhas brutas (${days} dias)`)
