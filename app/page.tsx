"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Activity, ShieldCheck, Calendar, ArrowRight, Stethoscope, 
  Zap, Syringe, HeartPulse, ChevronRight, ChevronLeft, User 
} from "lucide-react"

const CAROUSEL_ITEMS = [
  {
    id: 1,
    title: "Campanha de Vacinação 2025",
    desc: "Proteja-se contra a Influenza e Covid-19. Verifique sua elegibilidade agora.",
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?q=80&w=1920&auto=format&fit=crop",
    cta: "Ver Campanhas",
    link: "/portal/campaigns"
  },
  {
    id: 2,
    title: "Monitoramento de Saúde",
    desc: "Hipertenso ou Diabético? Acompanhe seus sinais vitais de casa e seu médico recebe em tempo real.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1920&auto=format&fit=crop",
    cta: "Começar Diário",
    link: "/portal/monitoring"
  },
  {
    id: 3,
    title: "Combate à Dengue",
    desc: "Sintomas de febre e dor no corpo? Faça a triagem digital antes de ir ao posto.",
    image: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=1920&auto=format&fit=crop",
    cta: "Fazer Triagem",
    link: "/triage"
  }
]

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % CAROUSEL_ITEMS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % CAROUSEL_ITEMS.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? CAROUSEL_ITEMS.length - 1 : prev - 1))

  const scrollToFeatures = (e: React.MouseEvent) => {
      e.preventDefault();
      document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <Activity size={20} />
            </div>
            <span>SideConsult</span>
          </div>
          
          <div className="flex items-center gap-4">
             <Link href="/login/doctor" className="hidden md:flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-full transition">
               <Stethoscope size={14} /> Área do Profissional
             </Link>

            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>

            <Link href="/login" className="text-slate-600 hover:text-blue-600 font-medium text-sm transition">
              Entrar
            </Link>
            <Link href="/register" className="px-5 py-2.5 bg-slate-900 text-white text-sm rounded-full hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">

        <section className="relative py-20 px-6 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50 rounded-full blur-3xl -z-10 opacity-60"></div>
            
            <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in">
                    <ShieldCheck size={14} /> Tecnologia a serviço da vida
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
                  Saúde Pública <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
                    Simples e Proativa.
                  </span>
                </h1>
                
                <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                  Conectamos cidadãos e médicos em um ecossistema inteligente. 
                  Triagem digital, agendamento rápido e monitoramento contínuo para quem mais precisa.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
                  <Link href="/triage" className="group flex items-center justify-center gap-3 px-8 py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition shadow-xl shadow-red-600/20 w-full sm:w-auto">
                    <Zap size={20} className="group-hover:scale-110 transition"/>
                    Triagem de Emergência
                  </Link>
                  <Link href="/login" className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:border-blue-300 hover:bg-blue-50 transition w-full sm:w-auto">
                    <User size={20} />
                    Acessar Portal
                  </Link>
                </div>
            </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 mb-24">
            <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl group bg-slate-900">
                {CAROUSEL_ITEMS.map((item, index) => (
                    <div 
                        key={item.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    >

                        <img 
                            src={item.image} 
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] ease-linear transform scale-105 group-hover:scale-110"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

                        <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-3xl z-10">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-widest mb-4 inline-block">Destaque</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{item.title}</h2>
                            <p className="text-slate-200 text-lg mb-8 max-w-xl leading-relaxed">{item.desc}</p>
                            <Link href={item.link} className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition">
                                {item.cta} <ArrowRight size={18}/>
                            </Link>
                        </div>
                    </div>
                ))}

                <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full text-white transition">
                    <ChevronLeft size={24} />
                </button>
                <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full text-white transition">
                    <ChevronRight size={24} />
                </button>

                <div className="absolute bottom-6 right-8 flex gap-2 z-20">
                    {CAROUSEL_ITEMS.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2 rounded-full transition-all ${currentSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                        />
                    ))}
                </div>
            </div>
        </section>

        <section id="features-section" className="py-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">Um Ecossistema Completo</h2>
                    <p className="text-slate-600 max-w-2xl mx-auto">Ferramentas integradas para cuidar da sua saúde, da prevenção ao tratamento.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={<Calendar className="text-teal-500" size={32}/>}
                        title="Agendamento Simplificado"
                        desc="Marque consultas presenciais ou vacinas sem filas. Escolha o profissional e o horário ideal pelo app."
                        link="/login"
                    />
                    <FeatureCard 
                        icon={<Activity className="text-blue-500" size={32}/>}
                        title="Triagem Inteligente"
                        desc="Algoritmos avançados classificam seu risco baseados em protocolos médicos e direcionam para o atendimento correto."
                        link="/triage"
                    />
                    <FeatureCard 
                        icon={<HeartPulse className="text-pink-500" size={32}/>}
                        title="Monitoramento Remoto"
                        desc="Registre pressão e glicose diariamente. Seu médico recebe alertas automáticos em caso de alterações."
                        link="/login"
                    />
                </div>
            </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-24">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-blue-900">
                <img 
                    src="https://images.unsplash.com/photo-1584515933487-779824d29309?q=80&w=1920&auto=format&fit=crop"
                    alt="Vacinação"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-blue-900/80 to-transparent"></div>

                <div className="relative z-10 p-8 md:p-16 text-white flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
                            <Syringe size={14} /> Imunização Digital
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Carteira de Vacinação Digital</h2>
                        <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                            Nunca mais perca seu histórico. Receba avisos de campanhas, verifique doses atrasadas e proteja você e sua família com tecnologia de ponta.
                        </p>
                        <div className="flex gap-4">
                            <Link href="/portal/campaigns" className="bg-white text-blue-700 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg inline-flex items-center gap-2">
                                Ver Campanhas Ativas <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-sm w-full max-w-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                <ShieldCheck size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">Status de Proteção</p>
                                <p className="text-sm text-blue-100">Atualizado hoje</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-blue-800/50 rounded-lg">
                                <span className="text-sm">Influenza 2025</span>
                                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">APLICADA</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-800/50 rounded-lg">
                                <span className="text-sm">Covid Bivalente</span>
                                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold">APLICADA</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-white/90 text-slate-900 rounded-lg shadow-lg transform scale-105">
                                <span className="text-sm font-bold">Dengue Dose 1</span>
                                <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded font-bold animate-pulse">PENDENTE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>








        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 text-white font-bold text-xl mb-4">
                        <Activity /> SideConsult
                    </div>
                    <p className="max-w-sm text-sm leading-relaxed mb-6">
                        Transformando a saúde pública através da tecnologia, dados inteligentes e humanização do atendimento.
                    </p>
                    <div className="text-xs">
                        &copy; 2025 SideConsult. Todos os direitos reservados.
                    </div>
                </div>

                <div className="flex flex-col justify-center items-start md:items-end">
                    <h4 className="text-white font-bold mb-4">Sobre o Produto</h4>
                    <a href="#features-section" onClick={scrollToFeatures} className="text-slate-300 hover:text-white transition flex items-center gap-2 group">
                        Conheça todos os benefícios <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
                    </a>
                </div>
            </div>
        </footer>

      </main>
    </div>
  )
}

function FeatureCard({ icon, title, desc, link }: { icon: React.ReactNode, title: string, desc: string, link: string }) {
    return (
        <Link href={link} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition duration-300 block group">
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl w-fit group-hover:bg-blue-50 transition">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
            <p className="text-slate-600 leading-relaxed mb-6">{desc}</p>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-sm group-hover:gap-3 transition-all">
                Acessar <ArrowRight size={16}/>
            </div>
        </Link>
    )
}