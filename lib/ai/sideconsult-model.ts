// Modelo SideConsult: regressão logística multinomial (softmax) treinada por ai/train.ts.
// O mesmo código de featurização é usado no treino e na inferência, então o que o modelo
// aprendeu é exatamente o que ele vê em produção. Inferência = soma ponderada + softmax (sem API externa).

export const SYMPTOMS = ['FEBRE_ALTA', 'DOR_TORACICA', 'FALTA_AR', 'DOR_CABECA', 'DOR_GARGANTA', 'DIARREIA'] as const

const SYMPTOM_LABELS: Record<string, string> = {
  FEBRE_ALTA: 'Febre alta', DOR_TORACICA: 'Dor no peito', FALTA_AR: 'Falta de ar',
  DOR_CABECA: 'Dor de cabeça', DOR_GARGANTA: 'Dor de garganta', DIARREIA: 'Diarreia/vômito',
}

const STOPWORDS = new Set(
  'que com uma para por mas nao sim dos das nos nas meu minha esta estou isso ele ela ontem hoje desde muito pouco tem ter faz fazem mais tambem quando apos depois antes como sao foi era ja'.split(' ')
)

export interface TriageInput {
  symptoms: string[]
  painLevel: number
  age?: number | null
  notes?: string | null
}

export interface ModelFile {
  version: string
  trainedAt: string
  classes: number[]       // gravidades 1..5
  vocab: string[]
  idf: number[]
  weights: number[][]     // [classe][feature]
  bias: number[]
  metrics?: Record<string, unknown>
}

export interface Prediction {
  severity: number
  confidence: number
  probs: number[]
  factors: { label: string; impact: number }[]
}

export const DEFAULT_AGE = 40

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z]+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

const BASE_FEATURES = SYMPTOMS.length + 4

export function featurize(input: TriageInput, vocab: string[], idf: number[]): number[] {
  const age = input.age ?? DEFAULT_AGE
  const x = [
    ...SYMPTOMS.map(s => (input.symptoms.includes(s) ? 1 : 0)),
    Math.min(Math.max(input.painLevel, 0), 10) / 10,
    Math.min(age, 100) / 100,
    age >= 65 ? 1 : 0,
    age <= 5 ? 1 : 0,
  ]
  // TF-IDF do relato livre, normalizado (L2)
  const index = new Map(vocab.map((w, i) => [w, i]))
  const tf = new Array(vocab.length).fill(0)
  for (const t of tokenize(input.notes ?? '')) {
    const i = index.get(t)
    if (i !== undefined) tf[i] += 1
  }
  const tfidf = tf.map((v, i) => v * idf[i])
  const norm = Math.sqrt(tfidf.reduce((a, v) => a + v * v, 0)) || 1
  return x.concat(tfidf.map(v => v / norm))
}

function featureLabel(j: number, input: TriageInput, vocab: string[]): string {
  if (j < SYMPTOMS.length) return SYMPTOM_LABELS[SYMPTOMS[j]]
  const k = j - SYMPTOMS.length
  if (k === 0) return `Dor ${input.painLevel}/10`
  if (k === 1) return `Idade ${input.age ?? DEFAULT_AGE}`
  if (k === 2) return 'Idoso (65+)'
  if (k === 3) return 'Criança (até 5 anos)'
  return `"${vocab[j - BASE_FEATURES]}" no relato`
}

export function softmax(z: number[]): number[] {
  const m = Math.max(...z)
  const e = z.map(v => Math.exp(v - m))
  const s = e.reduce((a, v) => a + v, 0)
  return e.map(v => v / s)
}

export function logits(x: number[], weights: number[][], bias: number[]): number[] {
  return weights.map((w, c) => w.reduce((acc, wj, j) => acc + wj * x[j], bias[c]))
}

export function predict(input: TriageInput, model: ModelFile): Prediction {
  const x = featurize(input, model.vocab, model.idf)
  const probs = softmax(logits(x, model.weights, model.bias))
  const c = probs.indexOf(Math.max(...probs))

  // Explicabilidade: quanto cada feature empurrou a classe escolhida acima da média das outras classes.
  const nClasses = model.weights.length
  const factors = x
    .map((xj, j) => {
      if (xj === 0) return null
      const mean = model.weights.reduce((a, w) => a + w[j], 0) / nClasses
      return { j, impact: (model.weights[c][j] - mean) * xj }
    })
    .filter((f): f is { j: number; impact: number } => !!f && f.impact > 0.05)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map(f => ({ label: featureLabel(f.j, input, model.vocab), impact: Number(f.impact.toFixed(2)) }))

  return { severity: model.classes[c], confidence: Number(probs[c].toFixed(3)), probs, factors }
}
