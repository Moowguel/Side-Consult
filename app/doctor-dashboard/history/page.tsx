import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Calendar, User, FileText } from 'lucide-react'


export default async function DoctorHistoryPage() {
  const cookieStore = await cookies()
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId
  
  if (!sessionId) redirect('/login')

    
  const history = await prisma.appointment.findMany({
    where: {
        doctorId: sessionId,
        status: "CONCLUIDO"
    },
    include: {
        patient: true,
        triage: true
    },
    orderBy: { date: 'desc' } 
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/doctor-dashboard" className="p-2 bg-white rounded-lg hover:bg-slate-200 transition">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Histórico de Atendimentos</h1>
                <p className="text-slate-500 text-sm">Registro de pacientes atendidos e diagnósticos.</p>
            </div>
        </div>

        {history.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">Você ainda não finalizou nenhum atendimento.</p>
            </div>
        ) : (
            <div className="grid gap-4">
                {history.map((apt) => (
                    <div key={apt.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition">
                        
                        <div className="flex gap-4">
                            <div className="bg-green-100 p-3 rounded-full text-green-600 h-fit">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">{apt.patient.name}</h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1 mb-2">
                                    <User size={14}/> {apt.patient.role === 'CIDADAO' && apt.patient.email.includes('visitante') ? 'Visitante' : 'Paciente Cadastrado'}
                                </p>
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                    <Calendar size={12}/> 
                                    {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(apt.date)}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                                <FileText size={12}/> Diagnóstico / Conduta
                            </p>
                            <p className="text-slate-700 text-sm italic">
                                &quot;{apt.diagnosis || 'Sem anotações'}&quot;
                            </p>
                        </div>

                    </div>
                ))}
            </div>
        )}

      </div>
    </div>
  )
}