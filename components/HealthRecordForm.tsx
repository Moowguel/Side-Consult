"use client";

import { useRef, useState } from "react";
import { Activity, HeartPulse, Droplets, Save, Wind, AlertTriangle, CheckCircle2 } from "lucide-react";
import { submitHealthRecord } from "@/app/actions/monitoring-actions";

const input = "w-full p-3 border rounded-lg text-center font-mono text-lg focus:ring-2 focus:ring-pink-500 outline-none font-bold text-slate-700";

export default function HealthRecordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function action(formData: FormData) {
    setSaving(true);
    const res = await submitHealthRecord(formData);
    setSaving(false);
    if (!res.success) return setFeedback({ ok: false, text: res.message ?? "Erro." });
    formRef.current?.reset();
    setFeedback(res.alert ? { ok: false, text: res.alert } : { ok: true, text: "Registro salvo. Tudo dentro do esperado." });
  }

  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
      <h2 className="text-lg font-bold text-slate-700 mb-5 flex items-center gap-2"><Activity className="text-pink-500" /> Registro manual</h2>
      <form ref={formRef} action={action} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><HeartPulse size={14} /> Pressão Arterial (mmHg)</label>
          <div className="flex gap-2 items-center">
            <input name="systolic" type="number" inputMode="numeric" placeholder="120" aria-label="Pressão sistólica" className={input} />
            <span className="text-slate-400 text-xl">/</span>
            <input name="diastolic" type="number" inputMode="numeric" placeholder="80" aria-label="Pressão diastólica" className={input} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Droplets size={14} /> Glicemia</label>
            <input name="glucose" type="number" inputMode="numeric" placeholder="95" className={input} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><HeartPulse size={14} /> FC (bpm)</label>
            <input name="heartRate" type="number" inputMode="numeric" placeholder="72" className={input} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><Wind size={14} /> SpO2 %</label>
            <input name="spo2" type="number" inputMode="numeric" placeholder="98" className={input} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observações</label>
          <textarea name="notes" rows={2} maxLength={500} placeholder="Ex: Em jejum, após caminhada..." className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none" />
        </div>
        {feedback && (
          <p className={`p-3 rounded-lg text-sm flex gap-2 ${feedback.ok ? "bg-green-50 text-green-800" : "bg-orange-50 text-orange-800"}`} role="alert">
            {feedback.ok ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />} {feedback.text}
          </p>
        )}
        <button type="submit" disabled={saving} className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white font-bold rounded-xl shadow-lg shadow-pink-600/20 flex justify-center items-center gap-2 transition">
          <Save size={20} /> {saving ? "Salvando..." : "Salvar Dados"}
        </button>
      </form>
    </section>
  );
}
