import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'
import { Activity, Calendar, FileText, Stethoscope, LogOut, Syringe, HeartPulse, MapPin, Bell, ShieldCheck } from 'lucide-react'
import { InstallAppButton } from '@/components/PwaClient' 

import { logout } from '@/app/actions/login-actions'


export default async function PortalPage() {
  const cookieStore = await cookies()
  const sessionId = verifySession(cookieStore.get(SESSION_COOKIE)?.value)?.userId
  
  if (!sessionId) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: sessionId } })
  if (!user) redirect('/login')

  const accessLogs = await prisma.accessLog.findMany({ where: { patientId: user.id }, include: { actor: true }, orderBy: { createdAt: 'desc' }, take: 5 })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
          <Activity />
          <span className="hidden sm:inline">Portal do Cidadão</span>
        </div>
        <div className="flex items-center gap-4">
            <InstallAppButton className="text-blue-600 bg-blue-50 px-3 py-2 rounded-lg" />
            <div className="relative cursor-pointer group">
                <Bell size={20} className="text-slate-500 group-hover:text-blue-600 transition"/>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </div>
            
            <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-700">{user.name}</p>
                <p className="text-xs text-slate-500">Cartão SUS: {user.cpf || "---"}</p>
            </div>
            
            <form action={logout}>
                <button className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 font-medium bg-red-50 px-3 py-2 rounded-lg transition">
                    <LogOut size={16} /> <span className="hidden sm:inline">Sair</span>
                </button>
            </form>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 mt-2">
        
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded uppercase tracking-wide mb-2 inline-block">Campanha Nacional</span>
                <h2 className="text-2xl font-bold mb-2">Vacinação contra Influenza</h2>
                <p className="text-blue-100 max-w-lg">A campanha já começou para grupos prioritários. Verifique sua carteira digital e proteja-se antes do inverno chegar.</p>
            </div>
            
            <Link 
                href="/portal/campaigns" 
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-sm whitespace-nowrap"
            >
                Verificar Elegibilidade
            </Link>
        </div>

        <h1 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <HeartPulse className="text-red-500"/> Serviços Disponíveis
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            <Link href="/triage" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-400 transition relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">IA</div>
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                    <Activity size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Triagem Inteligente</h3>
                <p className="text-slate-500 text-sm">Sente algum sintoma? Nossa IA classifica seu risco e direciona o atendimento.</p>
            </Link>

            <Link href="/portal/appointments/new" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-teal-400 transition">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-teal-600 group-hover:text-white transition">
                    <Calendar size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Agendar Consulta</h3>
                <p className="text-slate-500 text-sm">Marque consultas presenciais ou telemedicina com especialistas.</p>
            </Link>

            <Link href="/portal/history" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-purple-400 transition">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                    <FileText size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Meus Atendimentos</h3>
                <p className="text-slate-500 text-sm">Histórico clínico, diagnósticos anteriores e receitas médicas.</p>
            </Link>

            <Link href="/portal/vaccines" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-orange-400 transition">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition">
                    <Syringe size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Carteira de Vacinação</h3>
                <p className="text-slate-500 text-sm">Acompanhe suas doses, próximas vacinas e campanhas ativas.</p>
            </Link>

            <Link href="/portal/monitoring" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-pink-400 transition">
                <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-pink-600 group-hover:text-white transition">
                    <HeartPulse size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Diário de Saúde</h3>
                <p className="text-slate-500 text-sm">Registre pressão arterial e glicose para acompanhamento remoto.</p>
            </Link>

            <Link href="/portal/units" className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-green-400 transition">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition">
                    <MapPin size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Unidades de Saúde</h3>
                <p className="text-slate-500 text-sm">Encontre postos de saúde e hospitais próximos à sua localização.</p>
            </Link>

        </div>

        <section className="mt-8 bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-1"><ShieldCheck className="text-emerald-600" size={20}/> Seus dados, sob seu controle (LGPD)</h2>
            <p className="text-sm text-slate-500 mb-4">Todo acesso ao seu prontuário é registrado. Veja quem consultou seus dados:</p>
            {accessLogs.length === 0 ? <p className="text-sm text-slate-400">Nenhum acesso registrado.</p> : (
                <ul className="space-y-2">
                    {accessLogs.map(l => (
                        <li key={l.id} className="text-sm text-slate-600 flex flex-wrap justify-between gap-2 border-b border-slate-50 pb-2">
                            <span><b>{l.actor.name}</b>{l.actor.crm ? ` (CRM ${l.actor.crm})` : ''} abriu seu prontuário</span>
                            <span className="text-slate-400">{l.createdAt.toLocaleString('pt-BR')}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
      </main>
    </div>
  )
}