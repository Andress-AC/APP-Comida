import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import Link from "next/link";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen pb-24 relative" style={{ zIndex: 1 }}>
      {/* Animated background orbs */}
      <div className="orb-teal" />
      <div className="orb-blue" />
      <div className="orb-deep" />

      <header className="sticky top-0 z-40" style={{ background: 'linear-gradient(180deg, var(--bg-deep) 65%, transparent)' }}>
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <h1 className="heading-display text-xl tracking-tight">
            <span className="text-warm">Nailed</span>Macros
          </h1>
          <Link
            href="/perfil"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-warm)" }}
            aria-label="Perfil"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--amber)" }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-5 pb-6" style={{ position: 'relative', zIndex: 1 }}>{children}</main>
      <BottomNav />
    </div>
  );
}
