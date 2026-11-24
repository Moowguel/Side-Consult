import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { BarChart3, Users, AlertTriangle, Activity, ArrowLeft, Radio, BrainCircuit, Clock, Download, Filter, Siren, Target, Map } from 'lucide-react'
import { dailySeries, detectOutbreak, mean, daysAgo } from '@/lib/analytics'
import AutoRefresh from '@/components/AutoRefresh'

export const dynamic = 'force-dynamic'

const REGIONS = ['Centro', 'Zona Norte', 'Zona Sul', 'Zona Leste', 'Zona Oeste']
const SYMPTOM_LABEL: Record<string, string> = {
  FEBRE_ALTA: 'Febre alta', DOR_TORACICA: 'Dor no peito', FALTA_AR: 'Falta de ar',
  DOR_CABECA: 'Dor de cabeça', DOR_GARGANTA: 'Dor de garganta', DIARREIA: 'Diarreia/vômito',
}
const SEV_COLORS = ['#4ade80', '#a3e635', '#eab308', '#f97316', '#ef4444']
const parse = (s: string): string[] => { try { return JSON.parse(s) } catch { return [] } }
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : '—')

interface PageProps { searchParams: Promise<Record<string, string | undefined>> }

function DailyChart({ series }: { series: { day: Date; count: number; movingAvg: number | null }[] }) {
  const w = 640, h = 200, pad = 24
  const max = Math.max(...series.map(s => s.count), 1)
  const bw = (w - pad * 2) / series.length
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2)
  const line = series.filter(s => s.movingAvg != null).map((s) => `${pad + series.indexOf(s) * bw + bw / 2},${y(s.movingAvg!)}`).join(' ')
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-52" role="img" aria-label="Casos por dia com média móvel de 7 dias">
      {series.map((s, i) => (
        <rect key={i} x={pad + i * bw + 1} y={y(s.count)} width={Math.max(bw - 2, 1)} height={h - pad - y(s.count)} rx={2} fill="#a78bfa">
          <title>{`${fmt(s.day)}: ${s.count} casos`}</title>
        </rect>
      ))}
      <polyline points={line} fill="none" stroke="#7c3aed" strokeWidth={2.5} />
      <line x1={pad} x2={w - pad} y1={h - pad} y2={h - pad} stroke="#e2e8f0" />
      <text x={pad} y={h - 6} fontSize={11} fill="#94a3b8">{fmt(series[0].day)}</text>
      <text x={w / 2} y={h - 6} fontSize={11} fill="#94a3b8" textAnchor="middle">{fmt(series[Math.floor(series.length / 2)].day)}</text>
      <text x={w - pad} y={h - 6} fontSize={11} fill="#94a3b8" textAnchor="end">{fmt(series[series.length - 1].day)}</text>
      <text x={pad} y={14} fontSize={11} fill="#94a3b8">máx {max}</text>
    </svg>
  )
}

export default async function AdminDashboard({ searchParams }: PageProps) {
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session || session.role !== 'GESTOR') redirect('/portal')

  const sp = await searchParams
  const days = [7, 30, 90].includes(Number(sp.dias)) ? Number(sp.dias) : 30
  const region = REGIONS.includes(sp.regiao ?? '') ? sp.regiao! : ''
  const minSev = Math.min(5, Math.max(1, Number(sp.gravidade) || 1))
  const source = ['APP', 'IOT', 'IMPORT'].includes(sp.fonte ?? '') ? sp.fonte! : ''

  const since = new Date(); since.setHours(0, 0, 0, 0); since.setDate(since.getDate() - days + 1)
  const triages = await prisma.triage.findMany({
    where: { createdAt: { gte: since }, severity: { gte: minSev }, ...(region && { region }), ...(source && { source }) },
    select: { createdAt: true, severity: true, symptoms: true, region: true, source: true, age: true, aiSeverity: true, ruleSeverity: true, doctorSeverity: true, appointment: { select: { date: true, status: true } } },
  })

  // ---------- KPIs ----------
  const total = triages.length
  const emergencies = triages.filter(t => t.severity >= 5).length
  const severe = triages.filter(t => t.severity >= 4).length
  const iot = triages.filter(t => t.source === 'IOT').length
  const raisedByAI = triages.filter(t => t.aiSeverity != null && t.aiSeverity > (t.ruleSeverity ?? 0)).length
  const reviewed = triages.filter(t => t.doctorSeverity != null && t.aiSeverity != null)
  const agreement = reviewed.filter(t => t.doctorSeverity === t.severity).length
  const waits = triages
    .filter(t => t.source !== 'IMPORT' && t.appointment && ['EM_ANDAMENTO', 'CONCLUIDO'].includes(t.appointment.status))
    .map(t => (t.appointment!.date.getTime() - t.createdAt.getTime()) / 60_000)
    .filter(m => m >= 0 && m < 24 * 60)

  const series = dailySeries(triages.map(t => t.createdAt), days)

  // ---------- Vigilância epidemiológica: surto por região × sintoma (independe dos filtros) ----------
  const last30 = await prisma.triage.findMany({
    where: { createdAt: { gte: daysAgo(30) }, region: { not: null } },
    select: { createdAt: true, region: true, symptoms: true },
  })
  const outbreaks = REGIONS.flatMap(r => Object.keys(SYMPTOM_LABEL).map(sym => {
    const dates = last30.filter(t => t.region === r && parse(t.symptoms).includes(sym)).map(t => t.createdAt)
    const o = detectOutbreak(dailySeries(dates, 30).map(s => s.count))
    return o ? { region: r, symptom: SYMPTOM_LABEL[sym], ...o } : null
  })).filter(Boolean).sort((a, b) => b!.ratio - a!.ratio) as { region: string; symptom: string; today: number; baseline: number; ratio: number }[]

  // ---------- Sintomas, gravidade e regiões ----------
  const symptomCounts: Record<string, number> = {}
  for (const t of triages) for (const s of parse(t.symptoms)) symptomCounts[s] = (symptomCounts[s] || 0) + 1
  const topSymptoms = Object.entries(symptomCounts).sort(([, a], [, b]) => b - a).slice(0, 6)
  const severityDistribution = [1, 2, 3, 4, 5].map(l => triages.filter(t => t.severity === l).length)
  const regionRows = REGIONS.map(r => {
    const rows = triages.filter(t => t.region === r)
    const counts: Record<string, number> = {}
    for (const t of rows) for (const s of parse(t.symptoms)) counts[s] = (counts[s] || 0) + 1
    const top = Object.entries(counts).sort(([, a], [, b]) => b - a)[0]
    return { region: r, n: rows.length, severe: rows.filter(t => t.severity >= 4).length, top: top ? SYMPTOM_LABEL[top[0]] : '—', age: Math.round(mean(rows.map(t => t.age).filter((a): a is number => a != null))) }
  })
  const maxRegion = Math.max(...regionRows.map(r => r.n), 1)

  const query = new URLSearchParams({ dias: String(days), ...(region && { regiao: region }), gravidade: String(minSev), ...(source && { fonte: source }) })

  const kpis = [
    { label: 'Atendimentos', value: total, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Emergências (nível 5)', value: emergencies, sub: pct(emergencies, total), icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
    { label: 'Casos graves (4-5)', value: severe, sub: pct(severe, total), icon: Activity, color: 'bg-orange-100 text-orange-600' },
    { label: 'Alertas IoT', value: iot, icon: Radio, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'IA elevou prioridade', value: raisedByAI, sub: 'casos que as regras subestimariam', icon: BrainCircuit, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Concordância IA × médico', value: reviewed.length ? pct(agreement, reviewed.length) : '—', sub: `${reviewed.length} casos revisados`, icon: Target, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Espera média', value: waits.length ? `${Math.round(mean(waits))} min` : '—', sub: 'triagem → início do atendimento', icon: Clock, color: 'bg-slate-100 text-slate-600' },
  ]

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link href="/doctor-dashboard" className="p-2 bg-white rounded-lg hover:bg-slate-200 transition shadow-sm" aria-label="Voltar"><ArrowLeft className="text-slate-600" /></Link>
          <div className="flex-1 min-w-[220px]">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Inteligência de Saúde Pública</h1>
            <p className="text-slate-500 text-sm">Vigilância epidemiológica, capacidade e desempenho da IA.</p>
          </div>
          <div className="flex items-center justify-between gap-3 w-full sm:w-auto">
          <AutoRefresh ms={15000} />
          <a href={`/api/export/triagens?${query}`} className="flex items-center gap-2 text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"><Download size={16} /> CSV p/ Power BI</a>
          </div>
        </div>

        {/* Filtros (GET nativo: funcionam sem JavaScript e geram URL compartilhável) */}
        <form className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <p className="col-span-2 md:col-span-5 text-sm font-bold text-slate-600 flex items-center gap-2"><Filter size={16} /> Filtros</p>
          <label className="text-xs font-bold text-slate-500">Período
            <select name="dias" defaultValue={days} className="mt-1 w-full p-2 border rounded-lg bg-white text-sm text-slate-700">
              <option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option>
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">Região
            <select name="regiao" defaultValue={region} className="mt-1 w-full p-2 border rounded-lg bg-white text-sm text-slate-700">
              <option value="">Todas</option>{REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">Gravidade mínima
            <select name="gravidade" defaultValue={minSev} className="mt-1 w-full p-2 border rounded-lg bg-white text-sm text-slate-700">
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>Nível {n}+</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-slate-500">Origem
            <select name="fonte" defaultValue={source} className="mt-1 w-full p-2 border rounded-lg bg-white text-sm text-slate-700">
              <option value="">Todas</option><option value="APP">Triagem no app</option><option value="IOT">Dispositivos IoT</option><option value="IMPORT">Importado das UBS</option>
            </select>
          </label>
          <button className="col-span-2 md:col-span-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg">Aplicar</button>
        </form>

        {outbreaks.length > 0 && (
          <section className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5">
            <h2 className="font-bold text-red-800 flex items-center gap-2 mb-3"><Siren size={20} /> Alerta de surto (casos hoje &gt; 2× a média dos 7 dias anteriores)</h2>
            <ul className="space-y-2">
              {outbreaks.slice(0, 5).map(o => (
                <li key={o.region + o.symptom} className="text-sm text-red-900">
                  <b>{o.symptom}</b> na <b>{o.region}</b>: {o.today} casos hoje vs. média {o.baseline}/dia{" "}
                  <span className="font-black">({o.ratio}×)</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-700 mt-3">Sugestão: reforçar equipe e insumos nas UBS da região e iniciar investigação epidemiológica.</p>
          </section>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
          {kpis.map(k => (
            <div key={k.label} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${k.color}`}><k.icon size={18} /></div>
              <p className="text-2xl font-black text-slate-800">{k.value}</p>
              <p className="text-xs font-bold text-slate-500">{k.label}</p>
              {k.sub && <p className="text-[11px] text-slate-400">{k.sub}</p>}
            </div>
          ))}
        </div>

        <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <h2 className="text-lg font-bold text-slate-700 mb-2 flex items-center gap-2"><BarChart3 size={20} className="text-purple-500" /> Casos por dia <span className="text-xs font-normal text-slate-400">(barras) e média móvel de 7 dias (linha)</span></h2>
          {total > 0 ? <DailyChart series={series} /> : <p className="text-slate-400 text-sm">Sem dados no filtro atual.</p>}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Map size={20} className="text-teal-500" /> Por região</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-400 uppercase"><th className="py-2">Região</th><th>Casos</th><th>Graves</th><th>Sintoma principal</th><th>Idade média</th></tr></thead>
                <tbody>
                  {regionRows.map(r => (
                    <tr key={r.region} className="border-t border-slate-100">
                      <td className="py-2 font-bold text-slate-700 whitespace-nowrap">{r.region}</td>
                      <td className="min-w-32">
                        <div className="flex items-center gap-2"><span className="w-8 text-right">{r.n}</span><span className="h-2 rounded bg-teal-400" style={{ width: `${(r.n / maxRegion) * 80}px` }} /></div>
                      </td>
                      <td>{pct(r.severe, r.n)}</td>
                      <td className="whitespace-nowrap">{r.top}</td>
                      <td>{r.age || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity size={20} className="text-blue-500" /> Distribuição de risco</h2>
            <div className="space-y-2">
              {severityDistribution.map((count, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="w-14 text-slate-500 font-bold">Nível {i + 1}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${total ? (count / total) * 100 : 0}%`, backgroundColor: SEV_COLORS[i] }} /></div>
                  <span className="w-12 text-right text-slate-600">{count}</span>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-bold text-slate-700 mt-6 mb-3">Sintomas mais comuns</h3>
            <div className="space-y-2">
              {topSymptoms.map(([name, count]) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1 font-bold text-slate-600"><span>{SYMPTOM_LABEL[name] ?? name}</span><span>{count}</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"><div className="bg-purple-500 h-full rounded-full" style={{ width: pct(count, total) }} /></div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
