"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUser } from "@/app/actions/login-actions"; 

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const result = await loginUser(formData);

    if (result.success) {
      router.push("/portal");
      router.refresh(); 
    } else {
      setError(result.message || "Erro ao entrar.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link href="/" className="flex items-center text-sm text-slate-400 hover:text-slate-600 mb-6 transition">
          <ArrowLeft size={16} className="mr-1" /> Voltar para Home
        </Link>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Bem-vindo de volta</h1>
        <p className="text-slate-500 mb-6">Acesse sua conta para ver histórico ou agendar.</p>


        {registered && (
           <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm rounded-lg border border-green-200">
             Cadastro realizado! Faça login para continuar.
           </div>
        )}
        {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
                name="email" 
                type="email" 
                required 
                placeholder="seu@email.com" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
                name="password" 
                type="password" 
                required 
                placeholder="••••••••" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400" 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Entrar"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-slate-500">
          Ainda não tem conta? <Link href="/register" className="text-blue-600 font-semibold hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}