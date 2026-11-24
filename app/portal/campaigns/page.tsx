import { getVaccines } from "@/app/actions/vaccine-actions"
import Link from "next/link"
import { ArrowLeft, Syringe, Calendar, MapPin, ShieldCheck, Info } from "lucide-react"

const ACTIVE_CAMPAIGNS = [
{
        id: 'flu-2025',
        title: 'Vacinação contra Influenza',
        subtitle: 'Campanha Nacional 2025',
        target: 'Idosos, Crianças e Profissionais da Saúde',
        deadline: '31/05/2025',
        vaccineMatch: 'Influenza',
        description: 'Proteja-se contra as novas cepas da gripe (H1N1, H3N2) antes do inverno chegar.'
    },
    {
        id: 'dengue-2025',
        title: 'Combate à Dengue',
        subtitle: 'Imunização Prioritária',
        target: 'Crianças e Adolescentes (10 a 14 anos)',
        deadline: 'Indeterminado',
        vaccineMatch: 'Dengue',
        description: 'Esquema de duas doses com intervalo de 3 meses. Fundamental para regiões endêmicas e surtos locais.'
    },
    {
        id: 'hpv-quad',
        title: 'HPV (Papilomavírus Humano)',
        subtitle: 'Prevenção do Câncer',
        target: 'Meninas e Meninos de 9 a 14 anos',
        deadline: 'Disponível o ano todo',
        vaccineMatch: 'HPV',
        description: 'Previne diversos tipos de câncer. A vacina é segura e recomendada antes do início da vida sexual.'
    },
    {
        id: 'sarampo-triplice',
        title: 'Sarampo, Caxumba e Rubéola',
        subtitle: 'Tríplice Viral',
        target: 'Crianças (12 meses) e Adultos não vacinados',
        deadline: 'Campanha de Erradicação',
        vaccineMatch: 'Tríplice',
        description: 'O sarampo é altamente contagioso. Verifique se você tomou as duas doses necessárias.'
    },
    {
        id: 'febre-amarela',
        title: 'Febre Amarela',
        subtitle: 'Áreas de Risco e Viajantes',
        target: 'Toda a população (Dose Única)',
        deadline: 'Permanente',
        vaccineMatch: 'Amarela',
        description: 'Essencial para quem mora ou viaja para áreas de mata. A dose única garante proteção vitalícia.'
    },
    {
        id: 'tetano-dt',
        title: 'Dupla Adulto (Tétano e Difteria)',
        subtitle: 'Reforço Decenal',
        target: 'Todos os Adultos',
        deadline: 'A cada 10 anos',
        vaccineMatch: 'Tétano',
        description: 'O reforço deve ser tomado a cada 10 anos. Em caso de ferimentos graves, antecipe a dose.'
    },
    {
        id: 'covid-bivalente',
        title: 'Covid-19 (Reforço Bivalente)',
        subtitle: 'Proteção Continuada',
        target: 'População Geral acima de 18 anos',
        deadline: 'Disponível o ano todo',
        vaccineMatch: 'Covid',
        description: 'Atualize seu esquema vacinal para garantir proteção contra variantes recentes (Omicron).'
    }
]

export default async function CampaignsPage() {
  const takenVaccines = await getVaccines()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/portal" className="p-2 bg-white rounded-lg hover:bg-slate-100 transition shadow-sm">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Campanhas Ativas</h1>
                <p className="text-slate-500 text-sm">Verifique sua elegibilidade e proteja-se.</p>
            </div>
        </div>

        <div className="space-y-6">
            {ACTIVE_CAMPAIGNS.map(campaign => {
                const isImmunized = takenVaccines.some(v => 
                    v.name.toLowerCase().includes(campaign.vaccineMatch.toLowerCase()) && 
                    v.status === 'APLICADA'
                )

                return (
                    <div key={campaign.id} className={`rounded-2xl p-6 border-2 transition-all ${isImmunized ? 'bg-white border-green-100 opacity-80' : 'bg-white border-blue-200 shadow-md'}`}>
                        
                        <div className="flex flex-col md:flex-row gap-6 justify-between">
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${isImmunized ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {isImmunized ? 'Imunizado' : 'Disponível'}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar size={12}/> Até {campaign.deadline}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-1">{campaign.title}</h3>
                                <p className="text-sm text-blue-600 font-medium mb-3">{campaign.subtitle}</p>
                                
                                <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                                    {campaign.description}
                                </p>

                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex gap-3 items-start">
                                    <Info size={18} className="text-slate-400 flex-none mt-0.5"/>
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Público Alvo</p>
                                        <p className="text-sm text-slate-700">{campaign.target}</p>
                                    </div>
                                </div>
                            </div>


                            <div className="flex flex-col justify-center items-center md:items-end gap-3 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                {isImmunized ? (
                                    <>
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div className="text-center md:text-right">
                                            <p className="font-bold text-green-700">Você está protegido!</p>
                                            <p className="text-xs text-green-600">Dose registrada no sistema.</p>
                                        </div>
                                        <Link href="/portal/vaccines" className="text-sm text-slate-500 hover:underline mt-2">
                                            Ver comprovante
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-2 animate-pulse">
                                            <Syringe size={32} />
                                        </div>
                                        <div className="text-center md:text-right mb-2">
                                            <p className="font-bold text-blue-700">Você é elegível</p>
                                            <p className="text-xs text-slate-500">Vá até a unidade mais próxima.</p>
                                        </div>
                                        <Link 
                                            href="/portal/units" 
                                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
                                        >
                                            <MapPin size={18} />
                                            Localizar Posto
                                        </Link>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                )
            })}
        </div>

      </div>
    </div>
  )
}