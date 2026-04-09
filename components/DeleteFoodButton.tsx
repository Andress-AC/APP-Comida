"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFood } from "@/actions/foods";

interface Props {
  foodId: string;
  label?: string;
  isGlobalAdmin?: boolean; // admin deleting a global food — shows warning + confirmation
}

export default function DeleteFoodButton({ foodId, label = "Eliminar alimento", isGlobalAdmin = false }: Props) {
  const [state, setState] = useState<"idle" | "confirm" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    setState("loading");
    const result = await deleteFood(foodId);
    if (result.error) {
      setError(result.error);
      setState("error");
    } else {
      router.push("/alimentos");
      router.refresh();
    }
  }

  if (isGlobalAdmin && state === "confirm") {
    return (
      <div
        className="space-y-3 p-4 rounded-xl"
        style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}
      >
        <div className="flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#f87171' }}>
              Acción irreversible
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Este alimento es global y será eliminado permanentemente para <strong>todos los usuarios</strong>.
              Los registros de consumo existentes que lo referencien quedarán sin alimento asociado.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setState("idle")}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
          >
            Sí, eliminar para todos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => isGlobalAdmin ? setState("confirm") : handleDelete()}
        disabled={state === "loading"}
        className="btn-danger w-full"
        style={{ opacity: state === "loading" ? 0.6 : 1 }}
      >
        {state === "loading" ? "Eliminando..." : label}
      </button>
      {state === "error" && (
        <p className="text-sm text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
