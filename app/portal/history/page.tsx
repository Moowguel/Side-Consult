import { withTitle } from '@/lib/analytics'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, History, Printer, Syringe, Video } from 'lucide-react'



const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

export default async function HistoryPage() {

  const cookieStore = await cookies()
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId
  
  if (!sessionId) redirect('/login')


  const appointments = await prisma.appointment.findMany({
    
    where: { patientId: sessionId },
    include: {
        doctor: true, 
        triage: true  
    },
    orderBy: { date: 'asc' } 
  })

  const now = new Date()
  const upcoming = appointments.filter(a => a.date >= now && a.status !== 'CANCELADO' && a.status !== 'CONCLUIDO')
  const history = appointments.filter(a => a.date < now || a.status === 'CANCELADO' || a.status === 'CONCLUIDO').reverse()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/portal" className="p-2 bg-white rounded-lg hover:bg-slate-100 transition shadow-sm">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Meus Atendimentos</h1>
                <p className="text-slate-500 text-sm">Gerencie suas consultas e veja seu histórico.</p>
            </div>
        </div>

        <div className="mb-10">
            <h2 className="text-lg font-bold text-blue-700 mb-4 flex items-center gap-2">
                <Calendar className="text-blue-500" size={20}/> 
                Próximos Agendamentos
            </h2>

            {upcoming.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center">
                    <p className="text-slate-500 mb-4">Você não tem nenhuma consulta agendada.</p>
                    <Link href="/portal/appointments/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition inline-block">
                        Agendar Agora
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {upcoming.map((apt) => (
                        <div key={apt.id} className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500 flex flex-col md:flex-row justify-between items-center gap-4">
                            
                            <div className="flex items-center gap-4 w-full">
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-xl flex flex-col items-center min-w-[80px]">
                                    <span className="text-2xl font-bold">{apt.date.getDate()}</span>
                                    <span className="text-xs uppercase font-bold">
                                        {new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(apt.date)}
                                    </span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-slate-800">
                                            {apt.type === 'VACINA' ? `Vacina: ${apt.vaccineName}` : withTitle(apt.doctor?.name)}
                                        </h3>
                                        {apt.type === 'VACINA' && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><Syringe size={10}/> VACINA</span>}
                                    </div>
                                    
                                    <p className="text-slate-500 text-sm">{apt.doctor?.specialty || "Clínica Médica"}</p>
                                    
                                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                                        <span className="flex items-center gap-1"><Clock size={14}/> {formatDate(apt.date).split(' ')[1]}</span>
                                        <span className="flex items-center gap-1"><MapPin size={14}/> Consultório 1</span>
                                    </div>
                                </div>
                            </div>

                            {/* Direita: Status */}
                            <div className="w-full md:w-auto text-right">
                                {apt.status === 'PENDENTE' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full whitespace-nowrap">
                                        <Clock size={12} /> Aguardando Aprovação
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full whitespace-nowrap">
                                        <CheckCircle2 size={12} /> Confirmado
                                    </span>
                                )}
                                {apt.modality === 'ONLINE' && apt.status === 'AGENDADO' && (
                                    <a 
                                        href="https://meet.new" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition shadow-md shadow-purple-600/20 animate-pulse"
                                    >
                                        <Video size={16} /> Entrar na Videochamada
                                    </a>
                                )}
                                
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div>
            <h2 className="text-lg font-bold text-slate-600 mb-4 flex items-center gap-2">
                <History className="text-slate-400" size={20}/> 
                Histórico
            </h2>

            {history.length === 0 ? (
                <p className="text-slate-400 text-sm italic">Nenhum histórico encontrado.</p>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    {history.map((apt, index) => (
                        <div key={apt.id} className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${index !== history.length - 1 ? 'border-b border-slate-100' : ''}`}>
                             <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-slate-700">
                                        {apt.type === 'VACINA' ? apt.vaccineName : apt.doctor?.specialty || "Consulta"}
                                    </p>
                                    {apt.doctor?.name && <span className="text-sm text-slate-500">- {withTitle(apt.doctor.name)}</span>}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">{formatDate(apt.date)}</p>
                             </div>
                             
                             <div className="flex items-center gap-3">
                                {apt.status === 'CONCLUIDO' && (
                                    <Link 
                                        href={`/portal/prescription/${apt.id}`}
                                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg transition"
                                    >
                                        <Printer size={14} /> Ver Receita
                                    </Link>
                                )}

                                <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                                    apt.status === 'CANCELADO' ? 'bg-red-100 text-red-600' : 
                                    apt.status === 'CONCLUIDO' ? 'bg-green-100 text-green-600' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                    {apt.status}
                                </span>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </div>
    </div>
  )
}