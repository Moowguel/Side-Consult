import { WifiOff, Phone } from 'lucide-react'

export const dynamic = 'force-static'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center"><WifiOff size={36} className="text-slate-500" /></div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Você está sem internet</h1>
        <p className="text-slate-500 mb-8">Assim que a conexão voltar, o SideConsult carrega normalmente. Seus dados de saúde não ficam salvos no aparelho, por segurança.</p>
        <a href="tel:192" className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg">
          <Phone size={20} /> Emergência? Ligue 192 (SAMU)
        </a>
      </div>
    </main>
  )
}
