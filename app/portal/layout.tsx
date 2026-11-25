import MobileNav from "@/components/MobileNav";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 md:pb-0">
      {children}
      <MobileNav />
    </div>
  );
}
