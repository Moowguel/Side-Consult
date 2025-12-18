import { getVaccines } from "@/app/actions/vaccine-actions"
import Link from "next/link"
import { ArrowLeft, Syringe, Calendar, CheckCircle2, Clock, AlertCircle, ShieldCheck } from "lucide-react"

// Helper para cores de status
const getStatusStyle = (status: string) => {
    if (status === 'APLICADA') return { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, border: 'border-green-200' }
    if (status === 'ATRASADA') return { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle, border: 'border-red-200' }
    return { bg: 'bg-blue-50', text: 'text-blue-700', icon: Clock, border: 'border-blue-200' } // Pendente
}

export default async function VaccinePage() {
  const vaccines = await getVaccines()

  // Separa a próxima vacina (Pendente)
  const nextVaccine = vaccines.find(v => v.status === 'PENDENTE')

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/portal" className="p-2 bg-white rounded-lg hover:bg-slate-100 transition shadow-sm">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Carteira Digital</h1>
                <p className="text-slate-500 text-sm">Histórico de imunização e próximas doses.</p>
            </div>
        </div>

        {/* BANNER DE CAMPANHA ATIVA */}
        {nextVaccine && (
            <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-2xl p-6 text-white shadow-lg mb-10 relative overflow-hidden">
                <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-10">
                    <Syringe size={150} />
                </div>
                
                <div className="relative z-10">
                    <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mb-2 inline-block">
                        Campanha Ativa
                    </span>
                    <h2 className="text-2xl font-bold mb-1">Chegou a hora de se proteger!</h2>
                    <p className="text-blue-100 mb-4 max-w-md">
                        Sua dose de <strong>{nextVaccine.name}</strong> está agendada/prevista. Compareça a um posto de saúde.
                    </p>
                    
                    <div className="flex gap-3">
                        <Link href="/portal/units" className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition">
                            Encontrar Posto
                        </Link>
                    </div>
                </div>
            </div>
        )}

        {/* LINHA DO TEMPO */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                <ShieldCheck className="text-green-600"/> Seu Histórico
            </h3>

            {vaccines.length === 0 ? (
                <p className="text-center text-slate-400 py-10">Nenhuma vacina registrada.</p>
            ) : (
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                    {vaccines.map((vac) => {
                        const style = getStatusStyle(vac.status)
                        const StatusIcon = style.icon

                        return (
                            <div key={vac.id} className="ml-8 relative">
                                {/* Bolinha da Linha do Tempo */}
                                <div className={`absolute -left-[41px] top-0 w-6 h-6 rounded-full border-4 border-white ${style.bg} flex items-center justify-center`}>
                                    <div className={`w-2 h-2 rounded-full ${style.text.replace('text-', 'bg-')}`}></div>
                                </div>

                                <div className={`p-4 rounded-xl border ${style.border} ${style.bg} bg-opacity-20`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{vac.name}</h4>
                                            <p className="text-sm font-medium text-slate-600">{vac.dose}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded bg-white ${style.text}`}>
                                            {vac.status}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={14}/> 
                                            {new Intl.DateTimeFormat('pt-BR').format(vac.date)}
                                        </div>
                                        {vac.location && (
                                            <div className="flex items-center gap-1">
                                                <Syringe size={14}/> 
                                                {vac.location}
                                            </div>
                                        )}
                                        {vac.batch && (
                                            <div className="font-mono bg-white px-1 rounded border border-slate-200">
                                                Lote: {vac.batch}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

      </div>
    </div>
  )
}