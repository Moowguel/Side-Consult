// Gera o dataset sintético de triagem usado para treinar o modelo SideConsult.
// Os rótulos seguem critérios clínicos de sinais de alarme (inspirados no Protocolo de Manchester):
// muitos deles aparecem SÓ no relato livre ("desmaiei", "fala enrolada"), que as regras por sintoma não leem.
// Uso: npx tsx ai/generate-dataset.ts [n=4000]
import { writeFileSync, mkdirSync } from 'node:fs'
import { SYMPTOMS } from '../lib/ai/sideconsult-model'

let seed = 42
const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)]
const chance = (p: number) => rand() < p

const NEUTRAL = ['comecou ontem a noite', 'estou assim faz dois dias', 'tomei dipirona e melhorou um pouco', 'senti depois do almoco', 'piorou de madrugada', 'ja tive isso antes', 'estou cansado', 'dormi mal', 'trabalho em pe o dia todo', 'nao tomei nenhum remedio']
const DESCRIPTIVE: Record<string, string[]> = {
  FEBRE_ALTA: ['febre de 38 e meio', 'calafrios a noite', 'corpo todo doendo', 'termometro marcou 39'],
  DOR_TORACICA: ['pontada no peito ao respirar fundo', 'aperto no peito', 'dor no peito depois de esforco'],
  FALTA_AR: ['cansaco para subir escada', 'respiracao curta', 'chiado no peito'],
  DOR_CABECA: ['dor de cabeca latejante', 'dor atras dos olhos', 'enxaqueca de sempre'],
  DOR_GARGANTA: ['garganta arranhando', 'dor para engolir', 'placas na garganta'],
  DIARREIA: ['fui ao banheiro varias vezes', 'enjoo e vomito', 'comi algo estragado'],
}
// Sinais de alarme no texto: [frase, gravidade mínima]
const RED_FLAGS: [string, number][] = [
  ['desmaiei no banheiro', 4], ['tive um desmaio', 4], ['tive convulsao', 5], ['vomitei sangue', 4],
  ['sangramento que nao para', 4], ['estou confuso e sonolento', 4], ['fala enrolada e boca torta', 5],
  ['perdi a forca de um lado do corpo', 5], ['a pior dor de cabeca da minha vida', 5], ['labios roxos', 5],
  ['nao consigo falar de tanta falta de ar', 5], ['dor irradia para o braco esquerdo com suor frio', 5],
  ['estou gravida e com sangramento', 5], ['rigidez na nuca e manchas na pele', 5], ['urina muito pouca e boca seca', 3],
  ['sangue nas fezes', 4], ['bebe nao para de chorar e esta molinho', 4],
]

function clinicalSeverity(symptoms: string[], pain: number, age: number, flags: number[]): number {
  const idoso = age >= 65, crianca = age <= 5
  let s = 1
  if (symptoms.includes('DOR_GARGANTA')) s = Math.max(s, 1)
  if (symptoms.includes('DOR_CABECA')) s = Math.max(s, 2)
  if (symptoms.includes('DIARREIA')) s = Math.max(s, idoso || crianca ? 3 : 2)
  if (symptoms.includes('FEBRE_ALTA')) s = Math.max(s, idoso || crianca ? 4 : 3)
  if (symptoms.includes('FALTA_AR')) s = Math.max(s, idoso ? 5 : 4)
  if (symptoms.includes('DOR_TORACICA')) s = Math.max(s, age >= 50 ? 5 : 4)
  if (symptoms.includes('FEBRE_ALTA') && symptoms.includes('FALTA_AR')) s = Math.max(s, 4)
  if (pain >= 8) s = Math.max(s, 4)
  if (pain === 10) s = 5
  for (const f of flags) s = Math.max(s, f)
  return s
}

export function generate(n: number) {
  const rows: string[] = ['symptoms,pain_level,age,notes,severity']
  for (let i = 0; i < n; i++) {
    const nSym = pick([1, 1, 1, 2, 2, 3])
    const symptoms = [...new Set(Array.from({ length: nSym }, () => pick(SYMPTOMS)))]
    const age = chance(0.1) ? Math.floor(rand() * 6) : chance(0.25) ? 65 + Math.floor(rand() * 30) : 6 + Math.floor(rand() * 59)
    const pain = Math.min(10, Math.max(0, Math.round(rand() * 6 + (symptoms.includes('DOR_TORACICA') ? 2 : 0) + (chance(0.08) ? 4 : 0))))
    const phrases = [pick(NEUTRAL), pick(DESCRIPTIVE[pick(symptoms)])]
    const flags: number[] = []
    if (chance(0.22)) { const [f, sev] = pick(RED_FLAGS); phrases.push(f); flags.push(sev) }
    let severity = clinicalSeverity(symptoms, pain, age, flags)
    if (chance(0.05)) severity = Math.min(5, Math.max(1, severity + pick([-1, 1]))) // ruído de rotulagem
    const notes = phrases.sort(() => rand() - 0.5).join(', ')
    rows.push(`${symptoms.join(';')},${pain},${age},"${notes}",${severity}`)
  }
  return rows.join('\n') + '\n'
}

const n = Number(process.argv[2] ?? 4000)
mkdirSync('ai/data', { recursive: true })
writeFileSync('ai/data/triage_dataset.csv', generate(n))
console.log(`✅ ai/data/triage_dataset.csv gerado com ${n} casos`)
