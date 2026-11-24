import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE, isStaff } from '@/lib/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Activity, FileText, CheckCircle, BrainCircuit, Sparkles, Radio } from 'lucide-react'
import { finishAttendance } from '@/app/actions/medical-actions'
import { clinicalSummary } from '@/lib/clinical-summary'
import { maskCpf } from '@/lib/analytics'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AttendancePage({ params }: PageProps) {
  const { id } = await params
  const session = verifySession((await cookies()).get(SESSION_COOKIE)?.value)
  if (!session || !isStaff(session.role)) redirect('/login/doctor')

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { patient: true, triage: true },
  })
  if (!appointment) redirect('/doctor-dashboard')

  const patientId = appointment.patientId
  const [triages, records, vaccines, history] = await Promise.all([
    prisma.triage.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.healthRecord.findMany({ where: { patientId }, orderBy: { createdAt: 'asc' }, take: 200 }),
    prisma.vaccine.findMany({ where: { userId: patientId } }),
    prisma.appointment.findMany({ where: { patientId, id: { not: id } }, orderBy: { date: 'desc' }, take: 20 }),
  ])

  // LGPD: todo acesso ao prontuário fica registrado e o paciente pode consultar quem acessou.
  await prisma.accessLog.create({ data: { actorId: session.userId, patientId, action: 'ABRIU_PRONTUARIO' } })

  const triage = appointment.triage
  const age = triage?.age ?? (appointment.patient.birthYear ? new Date().getFullYear() - appointment.patient.birthYear : null)
  const summary = clinicalSummary({ age, triages, records, vaccines, appointments: history })

  let symptomsList: string[] = []
  try { if (triage?.symptoms) symptomsList = JSON.parse(triage.symptoms) } catch {}
  let factors: { label: string; impact: number }[] = []
  try { if (triage?.aiFactors) factors = JSON.parse(triage.aiFactors) } catch {}

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-4 mb-6">
          <Link href="/doctor-dashboard" className="p-2 bg-white rounded-lg hover:bg-slate-200 transition" aria-label="Voltar">
            <ArrowLeft className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Atendimento em Andamento</h1>
            <p className="text-slate-500 text-sm">Preencha os dados clínicos para finalizar.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600"><User size={24} /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Paciente</p>
                  <h2 className="font-bold text-slate-800 text-lg">{appointment.patient.name}</h2>
                </div>
              </div>
              <div className="space-y-2 text-sm text-slate-600">
                <p><span className="font-bold">CPF:</span> {maskCpf(appointment.patient.cpf)}</p>
                {age != null && <p><span className="font-bold">Idade:</span> {age} anos</p>}
                <p className="break-all"><span className="font-bold">Email:</span> {appointment.patient.email}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4 text-orange-600">
                {triage?.source === 'IOT' ? <Radio size={20} /> : <Activity size={20} />}
                <h3 className="font-bold">{triage?.source === 'IOT' ? 'Alerta do Dispositivo IoT' : 'Dados da Triagem'}</h3>
              </div>
              <div className="mb-4">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Nível de Gravidade</p>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${(triage?.severity ?? 0) >= 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  NÍVEL {triage?.severity ?? '-'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {symptomsList.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">{s.replace(/_/g, " ")}</span>
                ))}
              </div>
              {triage?.notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Relato Detalhado & Dor</p>
                  <div className="bg-yellow-50 p-3 rounded-lg text-sm text-slate-700 italic border border-yellow-100">&quot;{triage.notes}&quot;</div>
                </div>
              )}
            </div>

            {triage?.aiSeverity != null && (
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-3"><BrainCircuit size={20} /> Parecer da IA</h3>
                <p className="text-sm text-indigo-900">Regras: nível {triage.ruleSeverity} · IA: nível {triage.aiSeverity} ({Math.min(99, Math.round((triage.aiConfidence ?? 0) * 100))}%)</p>
                {factors.length > 0 && (
                  <ul className="mt-2 text-sm text-indigo-800 list-disc list-inside">
                    {factors.map(f => <li key={f.label}>{f.label}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Sparkles className="text-violet-500" size={20} /> Resumo clínico automático</h2>
              {summary.length ? (
                <ul className="space-y-2 text-sm text-slate-700">
                  {summary.map((s, i) => <li key={i} className="flex gap-2"><span className="text-violet-400">•</span>{s}</li>)}
                </ul>
              ) : <p className="text-sm text-slate-400">Sem histórico anterior.</p>}
            </section>

            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border-t-4 border-teal-600">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="text-teal-600" /> Conduta Médica & Diagnóstico
              </h2>
              <form action={async (formData) => {
                "use server"
                const diagnosis = formData.get('diagnosis') as string
                const sev = Number(formData.get('doctorSeverity'))
                await finishAttendance(appointment.id, diagnosis, sev || undefined)
              }}>
                <div className="mb-6">
                  <label htmlFor="diagnosis" className="block text-sm font-medium text-slate-700 mb-2">Descreva o diagnóstico e a solução (Receita/Encaminhamento):</label>
                  <textarea id="diagnosis" name="diagnosis" required className="w-full h-48 sm:h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none text-slate-700 text-lg leading-relaxed" placeholder="Ex: Paciente apresenta quadro de virose. Receitado repouso, hidratação e Dipirona 500mg a cada 6 horas..." />
                </div>

                {triage && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <label htmlFor="doctorSeverity" className="block text-sm font-bold text-slate-700 mb-1">Gravidade real do caso (confirme ou corrija a classificação)</label>
                    <p className="text-xs text-slate-500 mb-2">Sua resposta vira exemplo de treino: o modelo SideConsult aprende com cada atendimento.</p>
                    <select id="doctorSeverity" name="doctorSeverity" defaultValue={triage.severity} className="w-full p-3 border border-slate-300 rounded-lg bg-white">
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>Nível {n}{n === triage.severity ? ' (classificação atual)' : ''}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                  <Link href="/doctor-dashboard" className="px-6 py-3 text-center text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition">Cancelar</Link>
                  <button type="submit" className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 transition">
                    <CheckCircle size={20} /> Finalizar Atendimento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
