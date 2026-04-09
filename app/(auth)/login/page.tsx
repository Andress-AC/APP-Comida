"use client";

import { login } from "@/actions/auth";
import Link from "next/link";
import { useActionState } from "react";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const result = await login(formData);
      return result ?? null;
    },
    null
  );

  return (
    <div className="glass-card p-8">
      <h1 className="heading-display text-2xl text-center mb-1">NutriTrack</h1>
      <p className="text-center text-white/30 text-sm mb-6">Iniciar sesión</p>
      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white/50 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input-dark w-full"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white/50 mb-1">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="input-dark w-full"
          />
        </div>
        {state?.error && (
          <p className="text-red-400 text-sm">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="btn-primary w-full"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="text-center text-sm mt-4 text-white/40">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-amber-500 hover:text-amber-400 transition-colors">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
