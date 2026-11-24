"use client";


import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerPatient } from "@/app/actions/auth-actions"; 

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    password: "",
    birthYear: "",
    region: "",
    consent: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.type === "email" ? "email" : e.target.type === "password" ? "password" : e.target.placeholder === "000.000.000-00" ? "cpf" : "name"]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validação básica
    if (!formData.consent) {
        setError("É preciso aceitar o termo de uso de dados (LGPD) para continuar.");
        setIsLoading(false);
        return;
    }
    if (!formData.name || !formData.email || !formData.password || !formData.cpf) {
        setError("Todos os campos são obrigatórios.");
        setIsLoading(false);
        return;
    }

    // Chamada ao Server Action
    const result = await registerPatient({
        name: formData.name,
        email: formData.email,
        cpf: formData.cpf, 
        password: formData.password,
        birthYear: formData.birthYear ? Number(formData.birthYear) : null,
        region: formData.region || null,
        consent: formData.consent
    });

    if (result.success) {
         router.push("/login?registered=true");
    } else {
        setError(result.message);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Link href="/" className="flex items-center text-sm text-slate-400 hover:text-slate-600 mb-6 transition">
          <ArrowLeft size={16} className="mr-1" /> Voltar para Home
        </Link>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Crie sua conta</h1>
        <p className="text-slate-500 mb-6">Preencha seus dados para acessar o SUS Inteligente.</p>

        {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded-lg border border-red-200">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input 
                name="name"
                type="text" 
                placeholder="João da Silva" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
            <input 
                name="cpf"
                type="text" 
                placeholder="000.000.000-00" 
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input 
                name="email"
                type="email" 
                placeholder="seu@email.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input 
                name="password"
                type="password" 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400" 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ano de nascimento</label>
              <input name="birthYear" type="number" inputMode="numeric" placeholder="1980" value={formData.birthYear}
                onChange={(e) => setFormData({...formData, birthYear: e.target.value})}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white placeholder:text-slate-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Região</label>
              <select name="region" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-white">
                <option value="">Selecione</option>
                {["Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <input type="checkbox" checked={formData.consent} onChange={(e) => setFormData({...formData, consent: e.target.checked})} className="mt-0.5" />
            <span>Autorizo o uso dos meus dados de saúde para triagem, atendimento e estatísticas anonimizadas de saúde pública, conforme a LGPD (Lei 13.709/2018). Posso consultar quem acessou meu prontuário no portal.</span>
          </label>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Criar Conta"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-slate-500">
          Já tem conta? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}