"use client";

import { useState } from "react";
import { Activity, Thermometer, Wind, AlertCircle, CheckCircle2, Home, LayoutDashboard, Stethoscope, BrainCircuit, Bot, CalendarCheck, MapPin, ShieldCheck } from "lucide-react";
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

type TriageResponse = Extract<Awaited<ReturnType<typeof submitSmartTriage>>, { success: true }>;

function colorFor(score: number) {
  if (score >= 5) return "bg-red-50 text-red-900 border-red-200";
  if (score >= 3) return "bg-yellow-50 text-yellow-900 border-yellow-200";
  return "bg-green-50 text-green-900 border-green-200";
}

export default function TriageForm() {
  const [selected, setSelected] = useState<Symptom[]>([]);
  const [painLevel, setPainLevel] = useState(0);
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<TriageResponse | null>(null);

  const toggleSymptom = (id: string) => {
    const symptomId = id as Symptom;
    setSelected(selected.includes(symptomId) ? selected.filter((s) => s !== symptomId) : [...selected, symptomId]);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    const response = await submitSmartTriage(selected, painLevel, notes, age ? Number(age) : null);
    if (response.success) setResult(response);
    else setError(response.message);
    setIsSubmitting(false);
  };

  const reset = () => { setResult(null); setSelected([]); setPainLevel(0); setNotes(""); setAge(""); };

  if (result) {
    const isEmergency = result.score >= 5;
    return (
      <div className="p-4 sm:p-8 space-y-6">
        <div className={`p-6 sm:p-8 rounded-3xl border ${colorFor(result.score)} text-center`}>
          <div className="mb-4 flex justify-center">
            <div className={`p-5 rounded-full ${isEmergency ? "bg-red-100 animate-pulse" : "bg-white/70"}`}>
              {isEmergency ? <AlertCircle size={56} className="text-red-600" /> : <CheckCircle2 size={56} className={result.score >= 3 ? "text-yellow-600" : "text-green-600"} />}
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3 tracking-tight">{result.message}</h2>
          <p className="text-lg font-medium opacity-80">{result.action}</p>
        </div>

        {/* Explicação da IA */}
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 text-left">
          <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-3"><BrainCircuit size={20} /> Como a IA SideConsult decidiu</h3>
          <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
            <div className="bg-white rounded-xl p-3 border border-indigo-100">
              <p className="text-xs font-bold text-slate-400 uppercase">Regras (Manchester)</p>
              <p className="text-2xl font-black text-slate-700">Nível {result.ai.ruleSeverity}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-indigo-100">
              <p className="text-xs font-bold text-slate-400 uppercase">Modelo de IA</p>
              <p className="text-2xl font-black text-indigo-700">Nível {result.ai.aiSeverity} <span className="text-sm font-bold text-indigo-400">{Math.min(99, Math.round(result.ai.confidence * 100))}%</span></p>
            </div>
          </div>
          {result.ai.factors.length > 0 && (
            <>
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">O que mais pesou</p>
              <ul className="space-y-1 mb-3">
                {result.ai.factors.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(100, f.impact * 25)}px` }} />
                    {f.label}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="text-xs text-indigo-900/70 flex items-start gap-1">
            <ShieldCheck size={14} className="shrink-0 mt-0.5" />
            {result.ai.raisedByAI
              ? "A IA identificou sinais de alerta que as regras não captam e aumentou sua prioridade."
              : "As regras de segurança são o piso: a IA pode aumentar a prioridade, nunca reduzir."}
          </p>
        </section>

        {/* Passos do agente */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-left">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-3"><Bot size={20} className="text-teal-600" /> Agente de encaminhamento</h3>
          <ol className="space-y-2">
            {result.agent.steps.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600">
                <span className="w-6 h-6 shrink-0 rounded-full bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          {result.agent.appointment && (
            <div className="mt-4 p-3 rounded-xl bg-teal-50 border border-teal-100 text-teal-900 text-sm flex items-center gap-2">
              <CalendarCheck size={18} />
              {new Date(result.agent.appointment.date).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {result.agent.appointment.doctorName} · {result.agent.appointment.modality}
            </div>
          )}
          {result.agent.unit && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-900 text-sm flex items-center gap-2">
              <MapPin size={18} /> {result.agent.unit.name}: {result.agent.unit.address}
            </div>
          )}
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="px-6 py-4 bg-white hover:bg-slate-50 rounded-xl font-bold transition text-slate-700 shadow-sm border border-slate-200">
            Nova Triagem
          </button>
          {result.isLoggedUser ? (
            <Link href="/portal" className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition shadow-lg">
              <LayoutDashboard size={20} /> Ir para o Portal
            </Link>
          ) : (
            <Link href="/" className="flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold transition shadow-lg">
              <Home size={20} /> Voltar ao Início
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6">
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
          O que você sente?
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SYMPTOM_OPTIONS.map((option) => {
            const isSelected = selected.includes(option.id as Symptom);
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleSymptom(option.id)}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 text-center ${isSelected ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20" : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50"}`}
              >
                <div className={`p-3 rounded-full ${isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                  <Icon size={22} />
                </div>
                <span className={`font-bold text-sm ${isSelected ? "text-blue-900" : "text-slate-600"}`}>{option.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          Nível de Dor (0 a 10)
        </h2>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-slate-400">Sem Dor</span>
            <span className={`text-2xl font-black ${painLevel > 7 ? "text-red-500" : "text-blue-600"}`}>{painLevel}</span>
            <span className="text-sm font-bold text-slate-400">Insuportável</span>
          </div>
          <input type="range" min="0" max="10" value={painLevel} aria-label="Nível de dor" onChange={(e) => setPainLevel(parseInt(e.target.value))} className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            Idade
          </h2>
          <input type="number" inputMode="numeric" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ex: 67" className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700" />
        </div>
        <div className="sm:col-span-2">
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
            Conte com suas palavras
          </h2>
          <textarea className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-600" rows={3} maxLength={1000} placeholder="Ex: Comecou ontem, hoje desmaiei no banheiro..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><BrainCircuit size={12} /> A IA lê seu relato em busca de sinais de alerta.</p>
        </div>
      </section>

      {error && <p className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</p>}

      <button
        disabled={selected.length === 0 || isSubmitting}
        onClick={handleSubmit}
        className={`w-full py-5 rounded-2xl font-bold text-xl transition-all flex justify-center items-center gap-3 shadow-xl ${selected.length === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30"}`}
      >
        {isSubmitting ? <span className="animate-pulse">Analisando com IA...</span> : <>Classificar Risco <Stethoscope size={24} /></>}
      </button>
    </div>
  );
}
