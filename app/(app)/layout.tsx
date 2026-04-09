import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/actions/auth";
import BottomNav from "@/components/BottomNav";

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
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-muted hover:text-warm transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-5 pb-6" style={{ position: 'relative', zIndex: 1 }}>{children}</main>
      <BottomNav />
    </div>
  );
}
