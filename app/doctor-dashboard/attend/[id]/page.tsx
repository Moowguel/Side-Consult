import { PrismaClient } from '@prisma/client'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Activity, FileText, CheckCircle } from 'lucide-react'
import { finishAttendance } from '@/app/actions/medical-actions'

const prisma = new PrismaClient()


interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AttendancePage({ params }: PageProps) {

  const { id } = await params; 


  const appointment = await prisma.appointment.findUnique({
    where: { id: id }, 
    include: {
      patient: true,
      triage: true
    }
  })

  if (!appointment) redirect('/doctor-dashboard')

  let symptomsList: string[] = []
  try {
    if (appointment.triage?.symptoms) {
        symptomsList = JSON.parse(appointment.triage.symptoms)
    }
  } catch (e) {}

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        
        <header className="flex items-center gap-4 mb-8">
            <Link href="/doctor-dashboard" className="p-2 bg-white rounded-lg hover:bg-slate-200 transition">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Atendimento em Andamento</h1>
                <p className="text-slate-500 text-sm">Preencha os dados clínicos para finalizar.</p>
            </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Paciente</p>
                            <h2 className="font-bold text-slate-800 text-lg">{appointment.patient.name}</h2>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                        <p><span className="font-bold">CPF:</span> {appointment.patient.cpf || "Não informado"}</p>
                        <p><span className="font-bold">Email:</span> {appointment.patient.email}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                     <div className="flex items-center gap-2 mb-4 text-orange-600">
                        <Activity size={20} />
                        <h3 className="font-bold">Dados da Triagem</h3>
                     </div>
                     
                     <div className="mb-4">
                        <p className="text-xs text-slate-400 font-bold uppercase mb-1">Nível de Gravidade</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            (appointment.triage?.severity ?? 0) >= 5 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                            NÍVEL {appointment.triage?.severity}
                        </span>
                     </div>

                     <div>
                        <p className="text-xs text-slate-400 font-bold uppercase mb-2">Sintomas Relatados</p>
                        <div className="flex flex-wrap gap-2">
                            {symptomsList.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                                    {s.replace(/_/g, " ")}
                                </span>
                            ))}
                        </div>
                    </div>
                    {appointment.triage?.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                             <p className="text-xs text-slate-400 font-bold uppercase mb-2">Relato Detalhado & Dor</p>
                             <div className="bg-yellow-50 p-3 rounded-lg text-sm text-slate-700 italic border border-yellow-100">
                                "{appointment.triage.notes}"
                             </div>
                        </div>
                     )}
                </div>
            </div>

            <div className="md:col-span-2">
                <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-teal-600 h-full">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <FileText className="text-teal-600"/>
                        Conduta Médica & Diagnóstico
                    </h2>

                    <form action={async (formData) => {
                        "use server"
                        const diagnosis = formData.get('diagnosis') as string
                        await finishAttendance(appointment.id, diagnosis)
                    }}>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Descreva o diagnóstico e a solução (Receita/Encaminhamento):
                            </label>
                            <textarea 
                                name="diagnosis"
                                required
                                className="w-full h-64 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none text-slate-700 text-lg leading-relaxed"
                                placeholder="Ex: Paciente apresenta quadro de virose. Receitado repouso, hidratação e Dipirona 500mg a cada 6 horas..."
                            ></textarea>
                        </div>

                        <div className="flex justify-end gap-4">
                             <Link href="/doctor-dashboard" className="px-6 py-3 text-slate-500 hover:bg-slate-100 rounded-lg font-bold transition">
                                Cancelar
                             </Link>
                             <button type="submit" className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-lg shadow-teal-600/20 flex items-center gap-2 transition transform hover:scale-105">
                                <CheckCircle size={20} />
                                Finalizar Atendimento
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