import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { BarChart3, Users, AlertTriangle, Activity, ArrowLeft } from 'lucide-react'
import Link from 'next/link'


export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export default async function AdminDashboard() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('saude_session_id')?.value
  
  if (!sessionId) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: sessionId }})
  
  if (!user || user.role !== 'MEDICO') redirect('/portal')

  const allTriages = await prisma.triage.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const totalCases = allTriages.length
  const totalEmergencies = allTriages.filter(t => t.severity >= 5).length
  const totalUrgent = allTriages.filter(t => t.severity === 3 || t.severity === 4).length

  const symptomCounts: Record<string, number> = {}
  
  allTriages.forEach(t => {
    try {
        const symptoms = JSON.parse(t.symptoms) as string[]
        symptoms.forEach(s => {
            const cleanName = s.replace(/_/g, ' ')
            symptomCounts[cleanName] = (symptomCounts[cleanName] || 0) + 1
        })
    } catch (e) {}
  })

  const topSymptoms = Object.entries(symptomCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const severityDistribution = [0, 0, 0, 0, 0] 
  allTriages.forEach(t => {
    if (t.severity >= 1 && t.severity <= 5) {
        severityDistribution[t.severity - 1]++
    }
  })

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/doctor-dashboard" className="p-2 bg-white rounded-lg hover:bg-slate-200 transition shadow-sm">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Inteligência de Saúde Pública</h1>
                <p className="text-slate-500 text-sm">Monitoramento epidemiológico e gestão de capacidade.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
                    <Users size={32} />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-400 uppercase">Total de Atendimentos</p>
                    <p className="text-4xl font-black text-slate-800">{totalCases}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-red-100 p-4 rounded-xl text-red-600">
                    <AlertTriangle size={32} />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-400 uppercase">Emergências (Nível 5)</p>
                    <p className="text-4xl font-black text-red-600">{totalEmergencies}</p>
                    <p className="text-xs text-slate-400">{totalCases > 0 ? ((totalEmergencies/totalCases)*100).toFixed(1) : 0}% do total</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="bg-yellow-100 p-4 rounded-xl text-yellow-600">
                    <Activity size={32} />
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-400 uppercase">Casos Urgentes</p>
                    <p className="text-4xl font-black text-yellow-600">{totalUrgent}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-500"/>
                    Sintomas Mais Comuns (Top 5)
                </h2>
                
                <div className="space-y-4">
                    {topSymptoms.map(([name, count], index) => {
                        const percentage = totalCases > 0 ? ((count / totalCases) * 100).toFixed(1) : 0
                        return (
                            <div key={name}>
                                <div className="flex justify-between text-sm mb-1 font-bold text-slate-700">
                                    <span>{index + 1}. {name}</span>
                                    <span>{count} casos ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-purple-500 h-full rounded-full transition-all duration-1000" 
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}
                    {topSymptoms.length === 0 && <p className="text-slate-400 text-sm">Sem dados suficientes.</p>}
                </div>
                <p className="mt-6 text-xs text-slate-400 italic">
                    *Dados baseados nas queixas principais relatadas na triagem digital.
                </p>
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-blue-500"/>
                    Distribuição de Risco
                </h2>

                <div className="flex items-end justify-between h-64 gap-2 pt-4 px-2 border-b border-slate-100 pb-0">
                    {severityDistribution.map((count, index) => {
                        const level = index + 1
                        const heightPercentage = totalCases > 0 ? (count / totalCases) * 100 : 0
                        
                        const getColor = (lvl: number) => {
                            if (lvl >= 5) return '#ef4444'; 
                            if (lvl >= 4) return '#f97316'; 
                            if (lvl === 3) return '#eab308'; 
                            return '#4ade80';
                        }

                        return (
                            <div key={level} className="flex flex-col items-center flex-1 group h-full justify-end">
                                {/* Tooltip com a quantidade */}
                                <div className="text-xs font-bold text-slate-500 mb-2 opacity-0 group-hover:opacity-100 transition duration-300">
                                    {count} pac.
                                </div>
                                
                                {/* A Barra do Gráfico */}
                                <div 
                                    className="w-full max-w-[40px] rounded-t-md transition-all duration-1000 hover:opacity-80 relative group-hover:scale-105"
                                    style={{ 
                                        height: `${Math.max(heightPercentage, 2)}%`, 
                                        backgroundColor: getColor(level)
                                    }}
                                >
                                </div>
                            </div>
                        )
                    })}
                </div>
                
                <div className="flex justify-between mt-4 text-xs font-bold text-slate-400">
                    <div className="text-center flex-1">Nível 1</div>
                    <div className="text-center flex-1">Nível 2</div>
                    <div className="text-center flex-1">Nível 3</div>
                    <div className="text-center flex-1">Nível 4</div>
                    <div className="text-center flex-1">Nível 5</div>
                </div>
                
                <div className="flex justify-between mt-1 text-[10px] text-slate-300 uppercase tracking-wider">
                    <span>Baixa Complexidade</span>
                    <span>Alta Complexidade</span>
                </div>
            </section>

        </div>
      </div>
    </div>
  )
}