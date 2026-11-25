import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { ArrowLeft, HeartPulse, History, AlertTriangle, Radio, TrendingUp, TrendingDown, Wind, Droplets, Cpu } from 'lucide-react'
import Link from 'next/link'
import HealthRecordForm from '@/components/HealthRecordForm'
import AutoRefresh from '@/components/AutoRefresh'
import Sparkline from '@/components/Sparkline'
import { criticalVitals, linearTrend, personalAnomaly, isRecent } from '@/lib/analytics'

export const dynamic = 'force-dynamic'

function isWarning(r: { systolic: number | null; glucose: number | null; spo2: number | null; heartRate: number | null }) {
  return (r.systolic ?? 0) >= 140 || (r.glucose ?? 0) >= 126 || (r.spo2 != null && r.spo2 < 92) || criticalVitals(r).length > 0
}

export default async function MonitoringPage() {
  const cookieStore = await cookies()
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId
  if (!sessionId) redirect('/login')

  const [records, devices] = await Promise.all([
    prisma.healthRecord.findMany({ where: { patientId: sessionId }, orderBy: { createdAt: 'desc' }, take: 60 }),
    prisma.device.findMany({ where: { patientId: sessionId } }),
  ])
  const chrono = [...records].reverse()
  const latest = records[0]
  const series = (f: 'systolic' | 'heartRate' | 'spo2' | 'glucose') => chrono.map(r => r[f]).filter((v): v is number => v != null)

  const sysPoints = chrono.filter(r => r.systolic != null).map(r => ({ t: r.createdAt, v: r.systolic! }))
  const trend = linearTrend(sysPoints)
  const anomaly = latest?.systolic != null ? personalAnomaly(latest.systolic, series('systolic').slice(0, -1), 15) : null
  const online = devices.some(d => isRecent(d.lastSeen, 60_000))

  const cards = [
    { label: 'Pressão', value: latest?.systolic ? `${latest.systolic}/${latest.diastolic ?? '-'}` : '--', unit: 'mmHg', icon: HeartPulse, data: series('systolic'), ref: 140, color: '#db2777' },
    { label: 'Freq. cardíaca', value: latest?.heartRate ?? '--', unit: 'bpm', icon: HeartPulse, data: series('heartRate'), ref: 100, color: '#7c3aed' },
    { label: 'SpO2', value: latest?.spo2 ?? '--', unit: '%', icon: Wind, data: series('spo2'), ref: 92, color: '#0891b2' },
    { label: 'Glicemia', value: latest?.glucose ?? '--', unit: 'mg/dL', icon: Droplets, data: series('glucose'), ref: 126, color: '#ea580c' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 pb-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Link href="/portal" className="p-2 bg-white rounded-lg hover:bg-slate-100 transition shadow-sm" aria-label="Voltar"><ArrowLeft className="text-slate-600" /></Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-800">Diário de Saúde</h1>
            <p className="text-slate-500 text-sm">Monitoramento remoto de sinais vitais.</p>
          </div>
          <AutoRefresh ms={3000} />
        </div>

        {/* Dispositivos */}
        <div className="mb-6 bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
          <Cpu className="text-slate-500" />
          {devices.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum dispositivo vinculado. As medições são manuais.</p>
          ) : devices.map(d => (
            <span key={d.id} className="text-sm text-slate-700 flex items-center gap-2">
              <Radio size={16} className={online ? 'text-emerald-500' : 'text-slate-300'} />
              <b>{d.name}</b> · {d.lastSeen ? `última leitura ${d.lastSeen.toLocaleTimeString('pt-BR')}` : 'aguardando primeira leitura'}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${online ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{online ? 'online' : 'offline'}</span>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1"><c.icon size={14} /> {c.label}</p>
              <p className="text-2xl font-black text-slate-800 font-mono">{c.value} <span className="text-xs font-bold text-slate-400">{c.unit}</span></p>
              <Sparkline values={c.data.slice(-30)} refMax={c.ref} color={c.color} height={44} label={`Histórico de ${c.label}`} />
            </div>
          ))}
        </div>

        {(trend || anomaly) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {trend && (
              <div className={`rounded-2xl p-4 border ${trend.slopePerDay > 0.5 ? 'bg-orange-50 border-orange-200 text-orange-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                <p className="font-bold flex items-center gap-2">{trend.slopePerDay > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />} Tendência da pressão (regressão linear)</p>
                <p className="text-sm mt-1">{trend.slopePerDay > 0 ? '+' : ''}{trend.slopePerDay} mmHg/dia · projeção em 7 dias: <b>{trend.projection7d} mmHg</b>
                  {trend.projection7d >= 140 && ' — procure acompanhamento antes de chegar lá.'}</p>
              </div>
            )}
            {anomaly && (
              <div className="rounded-2xl p-4 border bg-red-50 border-red-200 text-red-900">
                <p className="font-bold flex items-center gap-2"><AlertTriangle size={18} /> Fora do SEU padrão</p>
                <p className="text-sm mt-1">Última pressão {latest!.systolic} vs. sua média de {anomaly.baseline} (z = {anomaly.z}). O alerta considera o seu histórico, não só a tabela geral.</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HealthRecordForm />

          <section>
            <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2"><History className="text-blue-500" /> Histórico Recente</h2>
            <div className="space-y-3">
              {records.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300"><p className="text-slate-400">Nenhum registro ainda.</p></div>
              ) : records.slice(0, 12).map(rec => {
                const warn = isWarning(rec)
                return (
                  <div key={rec.id} className={`p-4 rounded-xl shadow-sm bg-white border border-slate-100 border-l-4 ${warn ? 'border-l-red-500' : 'border-l-green-500'} flex justify-between gap-3`}>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 mb-1 font-bold uppercase flex items-center gap-2">
                        {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }).format(rec.createdAt)}
                        {rec.source === 'DEVICE' && <span className="text-[10px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded flex items-center gap-1"><Radio size={10} /> IoT</span>}
                      </p>
                      <p className={`font-mono font-bold text-sm ${warn ? 'text-red-700' : 'text-slate-700'}`}>
                        {[rec.systolic && `PA ${rec.systolic}/${rec.diastolic}`, rec.heartRate && `FC ${rec.heartRate}`, rec.spo2 && `SpO2 ${rec.spo2}%`, rec.glucose && `Glic ${rec.glucose}`].filter(Boolean).join(' · ')}
                      </p>
                      {rec.notes && rec.source !== 'DEVICE' && <p className="text-sm mt-1 text-slate-600 italic truncate">&quot;{rec.notes}&quot;</p>}
                    </div>
                    {warn && <AlertTriangle size={22} className="text-red-500 shrink-0" />}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
