"use client";

import Link from "next/link";
import { ArrowLeft, Stethoscope, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerDoctor } from "@/app/actions/doctor-actions";

export default function DoctorRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "", email: "", crm: "", specialty: "", password: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await registerDoctor(formData);

    if (result.success) {

      router.push("/login/doctor?registered=true");
    } else {
        setError(result.message);
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-teal-600">
        <Link href="/" className="flex items-center text-sm text-slate-400 hover:text-slate-600 mb-6 transition">
          <ArrowLeft size={16} className="mr-1" /> Voltar
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-teal-100 rounded-lg text-teal-700">
            <Stethoscope size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cadastro Profissional</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase">Apenas para equipe médica</p>
          </div>
        </div>

        {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                <input required type="text" onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 bg-white" />
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Especialidade</label>
                <input required type="text" placeholder="Ex: Cardiologia" onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 bg-white" />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
            <input required type="email" onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 bg-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CRM / UF</label>
                <input required type="text" placeholder="00000/SP" onChange={e => setFormData({...formData, crm: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 bg-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                <input required type="password" onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 bg-white" />
            </div>
          </div>
          
          <button disabled={isLoading} type="submit" className="w-full bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition flex justify-center">
            {isLoading ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro"}
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-slate-400">
           Já possui acesso? <Link href="/login/doctor" className="text-teal-600 hover:underline">Fazer Login</Link>
        </p>
      </div>
    </div>
  );
}