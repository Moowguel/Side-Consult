"use client"; 

import { useState } from "react";
import { Activity, Thermometer, Wind, AlertCircle, CheckCircle2, Home, LayoutDashboard, Stethoscope, Frown } from "lucide-react";
import { Symptom } from "@/lib/triageAlgorithm"; 
import Link from "next/link";
import { submitSmartTriage } from "@/app/actions/triage-actions"; 

const SYMPTOM_OPTIONS = [
  { id: "FEBRE_ALTA", label: "Febre Alta (> 38°C)", icon: Thermometer },
  { id: "DOR_TORACICA", label: "Dor no Peito", icon: Activity },
  { id: "FALTA_AR", label: "Falta de Ar", icon: Wind },
  { id: "DOR_CABECA", label: "Dor de Cabeça", icon: AlertCircle },
  { id: "DIARREIA", label: "Diarreia / Vômito", icon: AlertCircle },
  { id: "DOR_GARGANTA", label: "Dor de Garganta", icon: CheckCircle2 }, 
];

export default function TriageForm() {
  // Estados
  const [selected, setSelected] = useState<Symptom[]>([]);
  const [painLevel, setPainLevel] = useState(0); // 0 a 10
  const [notes, setNotes] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const toggleSymptom = (id: string) => {
    const symptomId = id as Symptom;
    if (selected.includes(symptomId)) {
      setSelected(selected.filter((s) => s !== symptomId));
    } else {
      setSelected([...selected, symptomId]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Enviamos os 3 dados agora: Sintomas, Dor e Notas
    const response = await submitSmartTriage(selected, painLevel, notes); 

    if (response.success) {
        const score = response.score ?? 0;
        let colorClass = "bg-green-50 text-green-900 border-green-200";
        
        if (score >= 5) colorClass = "bg-red-50 text-red-900 border-red-200";
        else if (score >= 3) colorClass = "bg-yellow-50 text-yellow-900 border-yellow-200";

        setResult({
          priorityLabel: response.message,
          action: response.action,
          color: colorClass,
          isLoggedUser: response.isLoggedUser
        });
    } else {
        alert("Erro técnico ao processar triagem.");
    }
    setIsSubmitting(false);
  };

  // TELA DE RESULTADO
  if (result) {
    return (
      <div className={`p-8 rounded-3xl border ${result.color} text-center animation-fade-in shadow-xl max-w-2xl mx-auto mt-10`}>
        <div className="mb-6 flex justify-center">
            {result.priorityLabel.includes("EMERGÊNCIA") ? (
                <div className="bg-red-100 p-6 rounded-full animate-pulse">
                    <AlertCircle size={64} className="text-red-600" />
                </div>
            ) : (
                <div className="bg-green-100 p-6 rounded-full">
                     <CheckCircle2 size={64} className={result.priorityLabel.includes("URGENTE") ? "text-yellow-600" : "text-green-600"} />
                </div>
            )}
        </div>
        
        <h2 className="text-3xl font-black mb-4 tracking-tight">{result.priorityLabel}</h2>
        <p className="text-xl font-medium mb-10 leading-relaxed opacity-80">{result.action}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
                onClick={() => { setResult(null); setSelected([]); setPainLevel(0); setNotes(""); }}
                className="px-6 py-4 bg-white hover:bg-slate-50 rounded-xl font-bold transition text-slate-700 shadow-sm border border-slate-200"
            >
                Nova Triagem
            </button>

            {result.isLoggedUser ? (
                <Link 
                    href="/portal"
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition shadow-lg"
                >
                    <LayoutDashboard size={20} />
                    Ir para o Portal
                </Link>
            ) : (
                <Link 
                    href="/"
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold transition shadow-lg"
                >
                    <Home size={20} />
                    Voltar ao Início
                </Link>
            )}
        </div>
      </div>
    );
  }

  // TELA DO FORMULÁRIO
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      
      {/* 1. Sintomas */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            O que você sente?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {SYMPTOM_OPTIONS.map((option) => {
            const isSelected = selected.includes(option.id as Symptom);
            const Icon = option.icon;
            return (
                <button
                key={option.id}
                onClick={() => toggleSymptom(option.id)}
                className={`
                    flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-center
                    ${isSelected 
                    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20" 
                    : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }
                `}
                >
                <div className={`p-3 rounded-full ${isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                    <Icon size={24} />
                </div>
                <span className={`font-bold text-sm ${isSelected ? "text-blue-900" : "text-slate-600"}`}>
                    {option.label}
                </span>
                </button>
            );
            })}
        </div>
      </section>

      {/* 2. Nível de Dor */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            Nível de Dor (0 a 10)
        </h2>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-bold text-slate-400">Sem Dor</span>
                <span className={`text-2xl font-black ${painLevel > 7 ? 'text-red-500' : 'text-blue-600'}`}>
                    {painLevel}
                </span>
                <span className="text-sm font-bold text-slate-400">Insuportável</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="10" 
                value={painLevel} 
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
                {[0,1,2,3,4,5,6,7,8,9,10].map(n => <span key={n}>{n}</span>)}
            </div>
        </div>
      </section>

      {/* 3. Observações */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            Alguma observação? <span className="text-xs font-normal text-slate-400 ml-auto">(Opcional)</span>
        </h2>
        <textarea 
            className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-600"
            rows={3}
            placeholder="Ex: Começou ontem à noite após o jantar..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
        />
      </section>

      {/* Botão Final */}
      <button
        disabled={selected.length === 0 || isSubmitting}
        onClick={handleSubmit}
        className={`
          w-full py-5 rounded-2xl font-bold text-xl transition-all flex justify-center items-center gap-3 shadow-xl
          ${selected.length === 0 
            ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30 transform hover:-translate-y-1"
          }
        `}
      >
        {isSubmitting ? (
             <span className="animate-pulse">Processando...</span>
        ) : (
            <>
                Gerar Diagnóstico
                <Stethoscope size={24}/>
            </>
        )}
      </button>

    </div>
  );
}