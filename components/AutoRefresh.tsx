"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Atualiza os dados do servidor periodicamente (monitoramento "ao vivo") sem recarregar a página.
// Pausa quando a aba está em segundo plano para não gastar bateria/dados no celular.
export default function AutoRefresh({ ms = 4000, label = "Ao vivo" }: { ms?: number; label?: string }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => { if (!document.hidden) router.refresh(); }, ms);
    return () => clearInterval(id);
  }, [router, ms]);
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full" role="status">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {label}
    </span>
  );
}
