import { Suspense } from "react";

// A página de login lê ?registered= da URL (useSearchParams), o que exige um limite de Suspense no build.
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Suspense>{children}</Suspense>;
}
