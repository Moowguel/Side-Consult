import TriageForm from "@/components/TriageForm";

export default function triage() {
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full mb-8 text-center">
        <h2 className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-2">
          Sistema Único de Saúde Inteligente
        </h2>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
          Bem-vindo ao Autoatendimento
        </h1>
        <p className="text-slate-600 text-lg">
          Utilize nossa inteligência artificial para classificar seu risco e agendar seu atendimento com segurança.
        </p>
      </div>
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <TriageForm />
      </div>
      <footer className="mt-12 text-slate-400 text-sm">
        &copy; 2024 SideConsult - Powered by Moowguel
      </footer>
    </main>
  );
}