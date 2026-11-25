"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, Calendar, HeartPulse, Syringe } from "lucide-react";

const ITEMS = [
  { href: "/portal", label: "Início", icon: Home },
  { href: "/triage", label: "Triagem", icon: Activity },
  { href: "/portal/appointments/new", label: "Agendar", icon: Calendar },
  { href: "/portal/monitoring", label: "Saúde", icon: HeartPulse },
  { href: "/portal/vaccines", label: "Vacinas", icon: Syringe },
];

// Barra de navegação inferior estilo app, só no celular (some a partir de telas médias).
export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 grid grid-cols-5 pb-[env(safe-area-inset-bottom)]" aria-label="Navegação principal">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/portal" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${active ? "text-blue-600" : "text-slate-500"}`}>
            <Icon size={22} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
