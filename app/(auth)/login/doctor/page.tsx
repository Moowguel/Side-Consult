"use client";

import Link from "next/link";
import { ArrowLeft, Stethoscope, Loader2, Lock } from "lucide-react"; 
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/app/actions/login-actions"; 

export default function DoctorLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
        const formData = new FormData(e.currentTarget);
        const result = await loginUser(formData);

        if (result.success) {
            console.log("Login sucesso, indo para:", result.redirectUrl);
            router.push(result.redirectUrl || "/portal");
            router.refresh(); 
        } else {
            setError(result.message || "Erro ao entrar.");
            setIsLoading(false);
        }
    } catch (err) {
        console.error("Erro crítico no login:", err);
        setError("Erro de conexão com o servidor.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
     
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-teal-600">
        <Link href="/" className="flex items-center text-sm text-slate-400 hover:text-slate-600 mb-6 transition">
          <ArrowLeft size={16} className="mr-1" /> Voltar para Home
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-teal-100 rounded-lg text-teal-700">
            <Stethoscope size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Área Médica</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Acesso Restrito</p>
          </div>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Corporativo</label>
            <div className="relative">
              <input 
                name="email" 
                type="email" 
                required
                placeholder="medico@hospital.com" 
                className="w-full pl-4 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 bg-white placeholder:text-slate-400" 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-teal-500 bg-white">
                <span className="pl-3 text-slate-400"><Lock size={16}/></span>
                <input 
                    name="password" 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    className="w-full px-3 py-2 outline-none text-slate-900 bg-white placeholder:text-slate-400" 
                />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex justify-center bg-teal-600 text-white font-bold py-3 rounded-lg hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Acessar Prontuário"}
          </button>
        </form>
        
        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 mb-2">Novo médico na equipe?</p>

            <Link href="/register/doctor" className="text-sm text-teal-700 font-medium hover:underline">
                Cadastrar Credencial
            </Link>
        </div>
      </div>
    </div>
  );
}