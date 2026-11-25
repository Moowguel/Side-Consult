import { linearTrend, mean } from './analytics'

// Resumo clínico automático (automação cognitiva): consolida o histórico disperso do paciente
// em poucas linhas para o médico ler em segundos. Texto montado a partir dos dados, sem LLM.

interface SummaryInput {
  age?: number | null
  triages: { createdAt: Date; severity: number; symptoms: string }[]
  records: { createdAt: Date; systolic: number | null; glucose: number | null; spo2: number | null; source: string }[]
  vaccines: { name: string; status: string }[]
  appointments: { date: Date; diagnosis: string | null; status: string }[]
}

export function clinicalSummary(d: SummaryInput): string[] {
  const out: string[] = []
  const since = Date.now() - 90 * 86_400_000
  const recentTriages = d.triages.filter(t => t.createdAt.getTime() >= since)
  if (recentTriages.length > 1) {
    const counts = new Map<string, number>()
    for (const t of recentTriages) for (const s of JSON.parse(t.symptoms) as string[]) counts.set(s, (counts.get(s) ?? 0) + 1)
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
    out.push(`${recentTriages.length} triagens nos últimos 90 dias; queixa mais frequente: ${top[0].replace(/_/g, ' ').toLowerCase()} (${top[1]}x).`)
  } else if (recentTriages.length === 0) {
    out.push('Primeira triagem nos últimos 90 dias.')
  }

  const sys = d.records.filter(r => r.systolic != null).map(r => ({ t: r.createdAt, v: r.systolic! }))
  if (sys.length) {
    const trend = linearTrend(sys)
    const avg = Math.round(mean(sys.map(p => p.v)))
    let line = `Pressão sistólica média ${avg} mmHg em ${sys.length} medições`
    if (trend && Math.abs(trend.slopePerDay) >= 0.5) line += `, tendência de ${trend.slopePerDay > 0 ? 'alta' : 'queda'} (${trend.slopePerDay > 0 ? '+' : ''}${trend.slopePerDay}/dia)`
    out.push(line + '.')
  }
  const glu = d.records.filter(r => r.glucose != null).map(r => r.glucose!)
  if (glu.length) out.push(`Glicemia média ${Math.round(mean(glu))} mg/dL (${glu.filter(g => g >= 126).length} leituras ≥ 126).`)
  const lowSpo2 = d.records.filter(r => r.spo2 != null && r.spo2 < 92).length
  if (lowSpo2) out.push(`${lowSpo2} leitura(s) de SpO2 abaixo de 92%.`)
  const devices = d.records.filter(r => r.source === 'DEVICE').length
  if (devices) out.push(`${devices} medições vieram de dispositivo IoT (monitoramento remoto ativo).`)

  const pending = d.vaccines.filter(v => v.status === 'PENDENTE').map(v => v.name)
  if (pending.length) out.push(`Vacinas pendentes: ${pending.join(', ')}.`)

  const lastDx = d.appointments.find(a => a.status === 'CONCLUIDO' && a.diagnosis)
  if (lastDx) out.push(`Último diagnóstico (${lastDx.date.toLocaleDateString('pt-BR')}): ${lastDx.diagnosis!.slice(0, 120)}${lastDx.diagnosis!.length > 120 ? '…' : ''}`)
  if (d.age != null && d.age >= 65) out.push('Paciente idoso (65+): atenção redobrada a quadros infecciosos e cardiovasculares.')
  return out
}
