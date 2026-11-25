// Treina o modelo SideConsult (regressão logística multinomial com TF-IDF) e exporta para lib/ai/model.json.
// Também compara Regras × Modelo × Híbrido no conjunto de teste e gera ai/REPORT.md (evidência da Área 1).
// Uso: npx tsx ai/train.ts   (inclui ai/data/feedback.csv, se existir: rótulos confirmados pelos médicos)
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { featurize, tokenize, softmax, logits, SYMPTOMS, type TriageInput, type ModelFile } from '../lib/ai/sideconsult-model'
import { ruleSeverity, type Symptom } from '../lib/triageAlgorithm'

type Row = TriageInput & { severity: number }
const CLASSES = [1, 2, 3, 4, 5]

function load(path: string): Row[] {
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8').trim().split(/\r?\n/).slice(1).flatMap(line => {
    const m = line.match(/^([^,]*),(\d+),(\d+),"(.*)",(\d)$/)
    if (!m) return []
    return [{ symptoms: m[1] ? m[1].split(';') : [], painLevel: +m[2], age: +m[3], notes: m[4], severity: +m[5] }]
  })
}

let seed = 7
const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

const base = load('ai/data/triage_dataset.csv')
const feedback = load('ai/data/feedback.csv')
if (base.length === 0) throw new Error('Rode antes: npx tsx ai/generate-dataset.ts')
const all = [...base, ...feedback].sort(() => rand() - 0.5)
const split = Math.floor(all.length * 0.8)
const train = all.slice(0, split), test = all.slice(split)

// Vocabulário: termos que aparecem em pelo menos 3 relatos do treino
const df = new Map<string, number>()
for (const r of train) for (const t of new Set(tokenize(r.notes ?? ''))) df.set(t, (df.get(t) ?? 0) + 1)
const vocab = [...df.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 400).map(([t]) => t)
const idf = vocab.map(t => Math.log((1 + train.length) / (1 + df.get(t)!)) + 1)

const X = train.map(r => featurize(r, vocab, idf))
const Y = train.map(r => CLASSES.indexOf(r.severity))
const F = X[0].length, K = CLASSES.length

// Peso por classe (inverso da frequência) para o modelo não ignorar as classes raras
const freq = CLASSES.map((_, c) => Y.filter(y => y === c).length || 1)
const classWeight = freq.map(f => train.length / (K * f))

const W = Array.from({ length: K }, () => new Array(F).fill(0))
const b = new Array(K).fill(0)
const LR = 2, L2 = 1e-5, EPOCHS = 3000
for (let epoch = 0; epoch < EPOCHS; epoch++) {
  const gW = Array.from({ length: K }, () => new Array(F).fill(0))
  const gb = new Array(K).fill(0)
  let loss = 0
  for (let i = 0; i < X.length; i++) {
    const p = softmax(logits(X[i], W, b))
    const cw = classWeight[Y[i]]
    loss -= cw * Math.log(p[Y[i]] + 1e-12)
    for (let c = 0; c < K; c++) {
      const err = cw * (p[c] - (c === Y[i] ? 1 : 0))
      if (err === 0) continue
      gb[c] += err
      const row = gW[c], x = X[i]
      for (let j = 0; j < F; j++) if (x[j] !== 0) row[j] += err * x[j]
    }
  }
  for (let c = 0; c < K; c++) {
    b[c] -= (LR * gb[c]) / X.length
    for (let j = 0; j < F; j++) W[c][j] -= LR * (gW[c][j] / X.length + L2 * W[c][j])
  }
  if (epoch % 500 === 0) console.log(`época ${epoch}  loss ${(loss / X.length).toFixed(4)}`)
}

const model: ModelFile = {
  version: `sideconsult-triage-${new Date().toISOString().slice(0, 10)}`,
  trainedAt: new Date().toISOString(),
  classes: CLASSES,
  vocab,
  idf: idf.map(v => +v.toFixed(4)),
  weights: W.map(r => r.map(v => +v.toFixed(4))),
  bias: b.map(v => +v.toFixed(4)),
}

// ---------- Avaliação no conjunto de teste (nunca visto no treino) ----------
const predModel = (r: Row) => CLASSES[softmax(logits(featurize(r, vocab, idf), W, b)).reduce((bi, v, i, a) => (v > a[bi] ? i : bi), 0)]
const predRule = (r: Row) => ruleSeverity(r.symptoms as Symptom[], r.painLevel)
const predHybrid = (r: Row) => Math.max(predRule(r), predModel(r))

function evaluate(pred: (r: Row) => number) {
  const p = test.map(pred)
  const grave = test.map((r, i) => [r.severity, p[i]]).filter(([t]) => t >= 4)
  const cm = CLASSES.map(t => CLASSES.map(q => test.filter((r, i) => r.severity === t && p[i] === q).length))
  return {
    accuracy: +(p.filter((v, i) => v === test[i].severity).length / test.length).toFixed(3),
    within1: +(p.filter((v, i) => Math.abs(v - test[i].severity) <= 1).length / test.length).toFixed(3),
    underTriage: +(p.filter((v, i) => v < test[i].severity).length / test.length).toFixed(3),
    graveMissed: +(grave.filter(([, q]) => q < 4).length / (grave.length || 1)).toFixed(3),
    confusion: cm,
  }
}

const results = { regras: evaluate(predRule), modelo: evaluate(predModel), hibrido: evaluate(predHybrid) }
model.metrics = { trainSize: train.length, testSize: test.length, feedbackRows: feedback.length, vocabSize: vocab.length,
  ...Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { accuracy: v.accuracy, underTriage: v.underTriage, graveMissed: v.graveMissed }])) }

writeFileSync('lib/ai/model.json', JSON.stringify(model))

const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const topTerms = (cls: number) => vocab.map((t, j) => [t, W[CLASSES.indexOf(cls)][j + SYMPTOMS.length + 4]] as const)
  .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => `\`${t}\``).join(', ')
const cmTable = (cm: number[][]) => ['| real \\ previsto | 1 | 2 | 3 | 4 | 5 |', '|---|---|---|---|---|---|',
  ...cm.map((row, i) => `| **${CLASSES[i]}** | ${row.join(' | ')} |`)].join('\n')

writeFileSync('ai/REPORT.md', `# Relatório de treino: modelo SideConsult de triagem

Gerado automaticamente por \`ai/train.ts\` em ${model.trainedAt}.

- Algoritmo: regressão logística multinomial (softmax), gradiente descendente, L2, pesos por classe
- Entradas: 6 sintomas, escala de dor, idade (+ faixas idoso/criança) e **TF-IDF do relato livre** (${vocab.length} termos)
- Dados: ${train.length} casos de treino / ${test.length} de teste (sintéticos${feedback.length ? ` + ${feedback.length} rótulos confirmados por médicos` : ''})

## Regras × Modelo × Híbrido (conjunto de teste)

| Abordagem | Acurácia | Erro de até 1 nível | Sub-triagem (classificou abaixo do real) | **Casos graves (4-5) que passaram como não graves** |
|---|---|---|---|---|
| Regras (Manchester simplificado) | ${pct(results.regras.accuracy)} | ${pct(results.regras.within1)} | ${pct(results.regras.underTriage)} | **${pct(results.regras.graveMissed)}** |
| Modelo SideConsult | ${pct(results.modelo.accuracy)} | ${pct(results.modelo.within1)} | ${pct(results.modelo.underTriage)} | **${pct(results.modelo.graveMissed)}** |
| **Híbrido (usado no app): max(regras, modelo)** | ${pct(results.hibrido.accuracy)} | ${pct(results.hibrido.within1)} | ${pct(results.hibrido.underTriage)} | **${pct(results.hibrido.graveMissed)}** |

**Ganho da IA:** as regras olham só para os sintomas marcados e a dor. O modelo também lê o relato livre
(ex.: "desmaiei", "fala enrolada") e a idade. No híbrido, as regras são o piso de segurança e a IA só pode
**aumentar** a gravidade, por isso a sub-triagem cai sem que a IA consiga "rebaixar" um caso grave.

## Matriz de confusão do híbrido

${cmTable(results.hibrido.confusion)}

## Termos do relato que mais puxam para EMERGÊNCIA (nível 5)

${topTerms(5)}

## Limitações

Treinado com dados **sintéticos** gerados a partir de critérios clínicos de sinais de alarme. Não é validado
clinicamente. O pipeline está pronto para re-treino com dados reais anonimizados: cada correção do médico no
atendimento vira um rótulo (\`npm run ai:feedback\` → \`npm run ai:train\`).
`)

console.table(Object.fromEntries(Object.entries(results).map(([k, v]) => [k, { acuracia: v.accuracy, subTriagem: v.underTriage, gravesPerdidos: v.graveMissed }])))
console.log('✅ lib/ai/model.json e ai/REPORT.md gerados')
