import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { ArrowLeft, HeartPulse, Activity, Save, Droplets, History, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { submitHealthRecord } from '@/app/actions/monitoring-actions'

const prisma = new PrismaClient()

function getStatusConfig(sys: number | null, gluc: number | null) {

    if ((sys && sys >= 140) || (gluc && gluc >= 126)) {
        return {
            container: 'bg-red-50 border-red-200',
            text: 'text-red-800', 
            borderLeft: 'border-l-4 border-l-red-500',
            icon: 'text-red-600'
        }
    }

    if ((sys && sys >= 130) || (gluc && gluc >= 100)) {
        return {
            
            container: 'bg-orange-50 border-orange-200',
            text: 'text-orange-800',
            borderLeft: 'border-l-4 border-l-orange-500',
            icon: 'text-orange-600'
        }
    }

    return {
        container: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        borderLeft: 'border-l-4 border-l-green-500',
        icon: 'text-green-600'
    }
}

export default async function MonitoringPage() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('saude_session_id')?.value
  if (!sessionId) redirect('/login')

  const records = await prisma.healthRecord.findMany({
    where: { patientId: sessionId },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/portal" className="p-2 bg-white rounded-lg hover:bg-slate-100 transition shadow-sm">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Diário de Saúde</h1>
                <p className="text-slate-500 text-sm">Monitoramento remoto de sinais vitais.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <Activity className="text-pink-500"/> Novo Registro
                </h2>

                <form action={async (formData) => {
                    "use server"
                    await submitHealthRecord(formData)
                }}>
                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                            <HeartPulse size={14}/> Pressão Arterial (mmHg)
                        </label>
                        <div className="flex gap-2 items-center">
                            <input name="systolic" type="number" placeholder="120" className="w-full p-3 border rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700"/>
                            <span className="text-slate-400 text-xl">/</span>
                            <input name="diastolic" type="number" placeholder="80" className="w-full p-3 border rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700"/>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                            <Droplets size={14}/> Glicemia (mg/dL)
                        </label>
                        <input name="glucose" type="number" placeholder="95" className="w-full p-3 border rounded-lg font-mono text-lg focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700"/>
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observações</label>
                        <textarea name="notes" rows={2} placeholder="Ex: Em jejum, após caminhada..." className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"></textarea>
                    </div>

                    <button type="submit" className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 flex justify-center items-center gap-2 transition">
                        <Save size={20}/> Salvar Dados
                    </button>
                </form>
            </section>

            <section>
                <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <History className="text-blue-500"/> Histórico Recente
                </h2>

                <div className="space-y-4">
                    {records.length === 0 ? (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-400">Nenhum registro ainda.</p>
                        </div>
                    ) : (
                        records.map((rec) => {
                            const config = getStatusConfig(rec.systolic, rec.glucose)
                            
                            return (
                                <div key={rec.id} className={`p-5 rounded-xl shadow-sm flex justify-between items-start bg-white border ${config.border} ${config.borderLeft}`}>
                                    <div>
                                        <p className="text-xs text-slate-400 mb-2 font-bold uppercase">
                                            {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(rec.createdAt)}
                                        </p>
                                        
                                        <div className="space-y-1">
                                            {rec.systolic && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">Pressão</span>
                                                    <span className={`font-mono font-black text-xl ${config.text}`}>
                                                        {rec.systolic}/{rec.diastolic}
                                                    </span>
                                                </div>
                                            )}
                                            {rec.glucose && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">Glicose</span>
                                                    <span className={`font-mono font-black text-xl ${config.text}`}>{rec.glucose}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {rec.notes && <p className="text-sm mt-3 text-slate-600 italic border-t border-slate-100 pt-2">"{rec.notes}"</p>}
                                    </div>

                                    {(config.text.includes('red') || config.text.includes('orange')) && (
                                        <AlertTriangle size={24} className={config.icon} />
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </section>

        </div>
      </div>
    </div>
  )
}