// Funções analíticas puras (sem banco): usadas no monitoramento, no IoT, no resumo clínico e no painel do gestor.

export const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0)
export const std = (v: number[]) => {
  if (v.length < 2) return 0
  const m = mean(v)
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / (v.length - 1))
}

// Anomalia personalizada: compara a leitura com a linha de base DO PRÓPRIO paciente (z-score),
// em vez de um limite fixo igual para todo mundo. minDelta evita alarme por variação clinicamente irrelevante
// (ex.: FC 69 vs média 73 num histórico muito estável).
export function personalAnomaly(value: number, history: number[], minDelta = 0, threshold = 2.5) {
  if (history.length < 5) return null // linha de base insuficiente
  const m = mean(history), s = Math.max(std(history), 1)
  const z = (value - m) / s
  return Math.abs(z) >= threshold && Math.abs(value - m) >= minDelta ? { z: +z.toFixed(1), baseline: Math.round(m) } : null
}

// Regressão linear simples (mínimos quadrados): inclinação em unidades por dia.
export function linearTrend(points: { t: Date; v: number }[]) {
  if (points.length < 3) return null
  const xs = points.map(p => p.t.getTime() / 86_400_000), ys = points.map(p => p.v)
  const mx = mean(xs), my = mean(ys)
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0)
  if (den === 0) return null
  const slope = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den
  return { slopePerDay: +slope.toFixed(2), projection7d: Math.round(ys[ys.length - 1] + slope * 7) }
}

// Limites clínicos fixos de segurança para alertas críticos do dispositivo.
export function criticalVitals(r: { systolic?: number | null; diastolic?: number | null; glucose?: number | null; heartRate?: number | null; spo2?: number | null }) {
  const out: { msg: string; severity: number }[] = []
  if (r.spo2 != null && r.spo2 < 90) out.push({ msg: `SpO2 ${r.spo2}% (hipoxemia)`, severity: r.spo2 < 85 ? 5 : 4 })
  if (r.systolic != null && r.systolic >= 180) out.push({ msg: `Pressão ${r.systolic}/${r.diastolic ?? '?'} (crise hipertensiva)`, severity: 5 })
  if (r.heartRate != null && (r.heartRate > 130 || r.heartRate < 40)) out.push({ msg: `Frequência cardíaca ${r.heartRate} bpm`, severity: 4 })
  if (r.glucose != null && (r.glucose < 54 || r.glucose > 300)) out.push({ msg: `Glicemia ${r.glucose} mg/dL`, severity: 4 })
  return out
}

// Série diária com média móvel de 7 dias e detecção de surto (casos > fator × média dos 7 dias anteriores).
export function dailySeries(dates: Date[], days: number, now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - days + 1)
  const counts = new Array(days).fill(0)
  for (const d of dates) {
    const i = Math.floor((d.getTime() - start.getTime()) / 86_400_000)
    if (i >= 0 && i < days) counts[i]++
  }
  return counts.map((count, i) => {
    const day = new Date(start); day.setDate(start.getDate() + i)
    const prev = counts.slice(Math.max(0, i - 7), i)
    return { day, count, movingAvg: prev.length ? +mean(prev).toFixed(1) : null }
  })
}

export function detectOutbreak(counts: number[], factor = 2, minCases = 8) {
  if (counts.length < 8) return null
  const today = counts[counts.length - 1]
  const baseline = mean(counts.slice(-8, -1))
  return today >= minCases && today > factor * Math.max(baseline, 1)
    ? { today, baseline: +baseline.toFixed(1), ratio: +(today / Math.max(baseline, 1)).toFixed(1) }
    : null
}

// Desvio mínimo relevante e direção de piora de cada sinal vital (SpO2 piora caindo; os demais, subindo).
export const VITAL_RULES = {
  systolic: { minDelta: 15, worse: 1, label: 'Pressão sistólica' },
  heartRate: { minDelta: 15, worse: 1, label: 'Frequência cardíaca' },
  glucose: { minDelta: 30, worse: 1, label: 'Glicemia' },
  spo2: { minDelta: 3, worse: -1, label: 'SpO2' },
} as const

export const maskCpf = (cpf?: string | null) =>
  cpf && cpf.length === 11 ? `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**` : '---'

// Helpers de tempo fora dos componentes (mantém a renderização pura para o React Compiler).
export const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000)
export const isRecent = (d: Date | null, ms: number) => !!d && Date.now() - d.getTime() < ms
