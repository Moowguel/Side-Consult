import { getHealthUnits } from "@/app/actions/unit-actions"
import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Building, Navigation } from "lucide-react"

// Dinâmica: a lista vem do banco e muda quando o médico cadastra unidades (antes ficava congelada no build).
export const dynamic = "force-dynamic"

const UnitIcon = ({ type }: { type: string }) => {
    if (type === 'HOSPITAL') return <div className="bg-red-100 p-3 rounded-full text-red-600"><Building size={24} /></div>
    if (type === 'FARMACIA') return <div className="bg-green-100 p-3 rounded-full text-green-600"><Building size={24} /></div>
    return <div className="bg-blue-100 p-3 rounded-full text-blue-600"><Building size={24} /></div>
}

export default async function UnitsPage() {
  const units = await getHealthUnits()

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/portal" className="p-2 bg-white rounded-lg hover:bg-slate-100 transition shadow-sm">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Rede de Saúde</h1>
                <p className="text-slate-500 text-sm">Encontre hospitais, postos e farmácias próximos.</p>
            </div>
        </div>

        {units.length === 0 ? (
            <div className="text-center py-20">
                <p className="text-slate-400">Nenhuma unidade cadastrada no sistema ainda.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {units.map(unit => (
                    <div key={unit.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition flex gap-4 items-start">
                        <UnitIcon type={unit.type} />
                        
                        <div className="flex-1">
                            <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-1 rounded mb-2 inline-block">
                                {unit.type}
                            </span>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{unit.name}</h3>
                            
                            <p className="text-sm text-slate-500 flex items-start gap-1 mb-2">
                                <MapPin size={14} className="mt-0.5 flex-none"/> 
                                {unit.address}
                            </p>
                            
                            {unit.phone && (
                                <p className="text-sm text-slate-500 flex items-center gap-1">
                                    <Phone size={14}/> {unit.phone}
                                </p>
                            )}

                            <a 
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unit.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline"
                            >
                                <Navigation size={14} /> Ver no Mapa
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  )
}