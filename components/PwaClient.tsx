"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallPromptEvent extends Event { prompt: () => Promise<void> }

// Registra o service worker (uma vez, no layout raiz). Só em produção: no `next dev` os arquivos de
// /_next/static não têm hash e o cache serviria JavaScript desatualizado a cada edição.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
    else navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()));
  }, []);
  return null;
}

// Botão "Instalar app": só aparece quando o navegador permite instalar (Chrome/Edge/Android).
export function InstallAppButton({ className = "" }: { className?: string }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e as InstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!prompt) return null;
  return (
    <button onClick={async () => { await prompt.prompt(); setPrompt(null); }} className={`inline-flex items-center gap-2 text-sm font-bold ${className}`}>
      <Download size={16} /> Instalar app
    </button>
  );
}
