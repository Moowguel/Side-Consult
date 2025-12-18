"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Plus, Building2, Phone, Save, Loader2 } from "lucide-react"
import { createHealthUnit } from "@/app/actions/unit-actions"

export default function NewUnitPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    
    const formData = new FormData(event.currentTarget)
    const res = await createHealthUnit(formData)

    if (res.success) {
        alert("Unidade cadastrada com sucesso!")
        router.push("/doctor-dashboard") 
        
    } else {
        alert(res.message)
        setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 border-t-4 border-purple-600">
        
        <div className="flex items-center gap-4 mb-8">
            <Link href="/doctor-dashboard" className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                <ArrowLeft className="text-slate-600" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-800">Nova Unidade de Saúde</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Unidade</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input name="name" required placeholder="Ex: Hospital Central" className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Tipo</label>
                    <select name="type" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white">
                        <option value="HOSPITAL">Hospital</option>
                        <option value="UBS">UBS (Posto de Saúde)</option>
                        <option value="UPA">UPA 24h</option>
                        <option value="FARMACIA">Farmácia Popular</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Endereço Completo</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input name="address" required placeholder="Rua das Flores, 123 - Centro" className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Telefone (Opcional)</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input name="phone" placeholder="(00) 0000-0000" className="w-full pl-10 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
                </div>
            </div>

            <button disabled={isLoading} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 flex justify-center items-center gap-2 transition">
                {isLoading ? <Loader2 className="animate-spin" /> : <><Save size={20}/> Cadastrar Local</>}
            </button>

        </form>
      </div>
    </div>
  )
}