import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { Activity } from 'lucide-react'
import PrintButton from './PrintButton' 


interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PrescriptionPage({ params }: PageProps) {
  const { id } = await params;
  const cookieStore = await cookies()
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId
  
  if (!sessionId) redirect('/login')

  const appointment = await prisma.appointment.findUnique({
    where: { id: id },
    include: {
        doctor: true,
        patient: true
    }
  })

  if (!appointment) return <div>Não encontrado</div>
  

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex justify-center items-start print:bg-white print:p-0">
      
      <div className="bg-white w-full max-w-[210mm] min-h-[297mm] p-12 shadow-2xl print:shadow-none flex flex-col relative">
        
        <PrintButton />

        <header className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-center">
            <div className="flex items-center gap-3 text-blue-600">
                <Activity size={40} />
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-widest">SideConsult</h1>
                    <p className="text-xs text-slate-500 font-bold uppercase">Sistema Único de Saúde Inteligente</p>
                </div>
            </div>
            <div className="text-right text-sm text-slate-500">
                <p>Receita Digital</p>
                <p>ID: {appointment.id.slice(0, 8).toUpperCase()}</p>
            </div>
        </header>

        <main className="flex-1">
            <div className="mb-8">
                <p className="text-sm text-slate-400 font-bold uppercase mb-1">Paciente</p>
                <h2 className="text-2xl font-bold text-slate-900">{appointment.patient.name}</h2>
                <p className="text-sm text-slate-600">CPF: {appointment.patient.cpf || "Não informado"}</p>
            </div>

            <div className="my-12">
                <h3 className="text-center font-bold text-xl underline decoration-2 underline-offset-4 mb-8">RECEITUÁRIO / ATESTADO</h3>
                
                <div className="text-lg leading-relaxed text-slate-800 whitespace-pre-wrap font-serif">
                    {appointment.diagnosis || "Nenhuma prescrição registrada."}
                </div>
            </div>
        </main>

        <footer className="mt-auto pt-12 flex flex-col items-center">
            <div className="w-64 border-t border-slate-900 mb-2"></div>
            <p className="font-bold text-slate-900">Dr(a). {appointment.doctor?.name}</p>
            <p className="text-sm text-slate-500">CRM: {appointment.doctor?.crm} | {appointment.doctor?.specialty}</p>
            
            <div className="mt-8 text-[10px] text-slate-400 text-center w-full border-t border-slate-200 pt-4">
                Documento gerado eletronicamente em {new Intl.DateTimeFormat('pt-BR').format(appointment.date)}.
                A autenticidade pode ser verificada no portal SideConsult.
            </div>
        </footer>

      </div>
    </div>
  )
}