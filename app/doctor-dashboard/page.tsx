import { withTitle } from '@/lib/analytics'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE, isStaff } from '@/lib/session'
import { Activity, Clock, AlertTriangle, CheckCircle2, LogOut, Calendar, XCircle, Check, PlayCircle, FileText, History, BarChart3, Radio, BrainCircuit } from 'lucide-react'
import AutoRefresh from '@/components/AutoRefresh'
import { logout } from '@/app/actions/login-actions'
import { manageAppointment } from '@/app/actions/doctor-appointment-actions'
import CallButton from './CallButton'
import Link from 'next/link'

export const dynamic = 'force-dynamic';



function formatTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(date)
}

function getSeverityConfig(score: number) {
  if (score >= 5) return { color: 'border-red-500 bg-red-50', text: 'text-red-700', label: 'EMERGÊNCIA', icon: AlertTriangle }
  if (score >= 3) return { color: 'border-yellow-400 bg-yellow-50', text: 'text-yellow-700', label: 'URGENTE', icon: Activity }
  return { color: 'border-blue-200 bg-white', text: 'text-blue-700', label: 'POUCO URGENTE', icon: CheckCircle2 }
}

export default async function DoctorDashboard() {
  const cookieStore = await cookies()
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId
  
  if (!sessionId) redirect('/login')

  const doctor = await prisma.user.findUnique({ where: { id: sessionId }})
  if (!doctor || !isStaff(doctor.role)) redirect('/portal')

  const activeAppointments = await prisma.appointment.findMany({
    where: { doctorId: doctor.id, status: "EM_ANDAMENTO" },
    include: { patient: true, triage: true }
  })

  const triageQueue = await prisma.triage.findMany({
    where: { appointment: null, source: { not: 'IMPORT' } },
    include: { patient: true },
    orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }]
  })

  const appointments = await prisma.appointment.findMany({
    where: {
        doctorId: doctor.id,
        status: { in: ['PENDENTE', 'AGENDADO'] },
        date: { gte: new Date() }
    },
    include: { patient: true },
    orderBy: { date: 'asc' }
  })

  return (
    <div className="min-h-screen bg-slate-100 pb-10 lg:h-screen flex flex-col">
      
      <header className="bg-white shadow-sm z-10 flex-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap gap-3 justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-teal-100 p-2 rounded-lg text-teal-700"><Activity size={20} /></div>
                <h1 className="text-xl font-bold text-slate-800 hidden sm:block">Painel Clínico</h1>
                <AutoRefresh ms={5000} />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right hidden sm:block border-r border-slate-200 pr-6 mr-2">
                    <p className="text-sm font-bold text-slate-700">{withTitle(doctor.name)}</p>
                    <p className="text-xs text-slate-500">{doctor.specialty} | CRM: {doctor.crm}</p>
                </div>
                
                {doctor.role === 'GESTOR' && <Link href="/management" className="flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition" title="Painel Administrativo">
                    <BarChart3 size={16} />
                    <span className="hidden md:inline">Gestão</span>
                </Link>}

                <Link href="/doctor-dashboard/history" className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition">
                    <History size={16} />
                    <span className="hidden md:inline">Histórico</span>
                </Link>

                <form action={logout}>
                    <button className="flex items-center gap-2 text-sm font-bold text-red-500 hover:text-red-700 bg-red-50 px-4 py-2 rounded-lg transition"><LogOut size={16} /> Sair</button>
                </form>
            </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full lg:overflow-hidden flex flex-col">

        {activeAppointments.length > 0 && (
            <div className="flex-none mb-6 bg-blue-600 rounded-xl p-4 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse-slow">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-full">
                        <PlayCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold">Você tem {activeAppointments.length} atendimento(s) em andamento!</h2>
                        <p className="text-blue-100 text-xs">O paciente {activeAppointments[0].patient.name} está aguardando conclusão.</p>
                    </div>
                </div>
                <Link 
                    href={`/doctor-dashboard/attend/${activeAppointments[0].id}`}
                    className="px-4 py-2 bg-white text-blue-700 font-bold text-sm rounded-lg hover:bg-blue-50 transition shadow-sm whitespace-nowrap"
                >
                    Retornar à Sala
                </Link>
            </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:h-full lg:overflow-hidden pb-4">
            
            <section className="flex flex-col lg:h-full lg:overflow-hidden">
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 flex-none">
                    <AlertTriangle size={20} className="text-orange-500"/>
                    Fila de Pronto Socorro
                </h2>

                <div className="space-y-4 lg:overflow-y-auto lg:pr-2 lg:pb-20 flex-1">
                    {triageQueue.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-400">Fila vazia.</p>
                        </div>
                    ) : (
                        triageQueue.map((item) => {
                            let symptomsList: string[] = [];
                            try { symptomsList = JSON.parse(item.symptoms); } catch { symptomsList = []; }
                            const config = getSeverityConfig(item.severity);
                            
                            return (
                                <div key={item.id} className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${config.color}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{item.patient.name}</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                <Clock size={12}/> Chegou às {formatTime(item.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${config.text} bg-white border border-current`}>{config.label}</span>
                                            {item.source === 'IOT' && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 flex items-center gap-1"><Radio size={10}/> ALERTA IoT</span>}
                                            {item.aiSeverity != null && item.aiSeverity > (item.ruleSeverity ?? 0) && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 flex items-center gap-1" title="A IA elevou a prioridade a partir do relato/idade"><BrainCircuit size={10}/> IA ELEVOU</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Sintomas</p>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {symptomsList.map((s, i) => (
                                                <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">{s.replace(/_/g, " ")}</span>
                                            ))}
                                        </div>
                                        
                                        {item.notes && (
                                            <div className="bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                                                <p className="text-xs font-bold text-slate-400 uppercase flex gap-1 items-center">
                                                    <FileText size={10}/> Relato
                                                </p>
                                                <p className="text-xs text-slate-700 italic line-clamp-2">&quot;{item.notes}&quot;</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <CallButton triageId={item.id} patientId={item.patientId} />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </section>

            <section className="flex flex-col lg:h-full lg:overflow-hidden">
                <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2 flex-none">
                    <Calendar size={20} className="text-blue-500"/>
                    Solicitações de Agenda
                </h2>


                <div className="space-y-4 lg:overflow-y-auto lg:pr-2 lg:pb-20 flex-1">
                    {appointments.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-400">Nenhum agendamento.</p>
                        </div>
                    ) : (
                        appointments.map((apt) => (
                            <div key={apt.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{apt.patient.name}</h3>
                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <Clock size={14}/> {formatTime(apt.date)}
                                        </p>
                                    </div>
                                    {apt.status === 'PENDENTE' ? (
                                        <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><Clock size={12}/> Pendente</span>
                                    ) : (
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1"><CheckCircle2 size={12}/> Confirmado</span>
                                    )}
                                </div>
                                
                                {apt.status === 'PENDENTE' && (
                                    <div className="flex gap-2 mt-2 pt-4 border-t border-slate-50">
                                        <form action={async () => { "use server"; await manageAppointment(apt.id, 'RECUSAR') }} className="flex-1">
                                            <button className="w-full flex justify-center items-center gap-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-bold text-sm rounded-lg transition"><XCircle size={16}/> Recusar</button>
                                        </form>
                                        <form action={async () => { "use server"; await manageAppointment(apt.id, 'CONFIRMAR') }} className="flex-1">
                                            <button className="w-full flex justify-center items-center gap-1 py-2 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 font-bold text-sm rounded-lg transition"><Check size={16}/> Aceitar</button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
      </main>
    </div>
  )
}