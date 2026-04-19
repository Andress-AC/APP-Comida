import { createClient } from "@/lib/supabase/server";
import { logout } from "@/actions/auth";
import Link from "next/link";

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, created_at")
    .eq("id", user!.id)
    .single();

  const joined = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="space-y-6">
      <h1 className="heading-display text-2xl">Perfil</h1>

      <div className="glass-card p-5 space-y-4">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: "var(--amber-glow)", border: "1.5px solid var(--border-warm-strong)", color: "var(--amber)" }}
          >
            {user?.email?.[0].toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
              {user?.email}
            </p>
            {profile?.is_admin && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "var(--amber-glow)", color: "var(--amber)", border: "1px solid var(--border-warm-strong)" }}
              >
                Admin
              </span>
            )}
          </div>
        </div>

        <div className="border-t" style={{ borderColor: "var(--border-subtle)" }} />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: "var(--text-muted)" }}>Correo</span>
            <span style={{ color: "var(--text-secondary)" }}>{user?.email}</span>
          </div>
          {joined && (
            <div className="flex justify-between">
              <span style={{ color: "var(--text-muted)" }}>Miembro desde</span>
              <span style={{ color: "var(--text-secondary)" }}>{joined}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: "var(--text-muted)" }}>ID de usuario</span>
            <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
              {user?.id?.slice(0, 8)}…
            </span>
          </div>
        </div>
      </div>

      {/* Admin tools */}
      {profile?.is_admin && (
        <div className="glass-card-static p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Admin
          </p>
          <Link
            href="/admin"
            className="flex items-center justify-between py-2 px-3 rounded-xl transition-all"
            style={{ background: "var(--amber-glow)", border: "1px solid var(--border-warm)" }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--amber)" }}>
              Alimentos sin macros completos
            </span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--amber)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/compra"
            className="flex items-center justify-between py-2 px-3 rounded-xl transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-subtle)" }}
          >
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Lista de la compra
            </span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* Lista de la compra for all users */}
      {!profile?.is_admin && (
        <Link
          href="/compra"
          className="flex items-center justify-between glass-card p-4"
        >
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Lista de la compra</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--text-muted)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}

      <div className="glass-card p-4 text-xs space-y-1" style={{ color: "var(--text-muted)" }}>
        <p className="font-medium" style={{ color: "var(--text-secondary)" }}>NailedMacros</p>
        <p>Versión en fase de prueba — algunos datos pueden cambiar.</p>
      </div>

      <form action={logout}>
        <button type="submit" className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ background: "rgba(255,107,107,0.08)", color: "var(--coral)", border: "1px solid rgba(255,107,107,0.2)" }}>
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
