"use client";

import { useState, useTransition } from "react";
import { updateFoodMacros } from "@/actions/foods";

interface Food {
  id: string;
  name: string;
  brand: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  sugar: number;
  salt: number;
  saturated_fat: number;
}

interface EditState {
  kcal: string;
  protein: string;
  fat: string;
  saturated_fat: string;
  carbs: string;
  sugar: string;
  fiber: string;
  salt: string;
}

function toEdit(f: Food): EditState {
  return {
    kcal: String(f.kcal),
    protein: String(f.protein),
    fat: String(f.fat),
    saturated_fat: String(f.saturated_fat),
    carbs: String(f.carbs),
    sugar: String(f.sugar),
    fiber: String(f.fiber),
    salt: String(f.salt),
  };
}

export default function AdminFoodsClient({ foods }: { foods: Food[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editVals, setEditVals] = useState<EditState | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.brand?.toLowerCase().includes(search.toLowerCase())
  );

  function startEdit(f: Food) {
    setEditing(f.id);
    setEditVals(toEdit(f));
  }

  function cancelEdit() {
    setEditing(null);
    setEditVals(null);
  }

  function handleSave(id: string) {
    if (!editVals) return;
    startTransition(async () => {
      await updateFoodMacros(id, {
        kcal: Number(editVals.kcal) || 0,
        protein: Number(editVals.protein) || 0,
        fat: Number(editVals.fat) || 0,
        saturated_fat: Number(editVals.saturated_fat) || 0,
        carbs: Number(editVals.carbs) || 0,
        sugar: Number(editVals.sugar) || 0,
        fiber: Number(editVals.fiber) || 0,
        salt: Number(editVals.salt) || 0,
      });
      setSaved((s) => new Set(s).add(id));
      setEditing(null);
      setEditVals(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar alimento..."
          className="flex-1 px-3 py-2 rounded-lg text-sm"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {filtered.length} alimentos
        </span>
      </div>

      <div className="space-y-2">
        {filtered.map((food) => (
          <div
            key={food.id}
            className="glass-card-static p-4 rounded-xl space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                  {food.name}
                </p>
                {food.brand && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{food.brand}</p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                {saved.has(food.id) && editing !== food.id && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: "var(--amber)", background: "var(--amber-glow)" }}>
                    Guardado
                  </span>
                )}
                {editing === food.id ? (
                  <>
                    <button
                      onClick={() => handleSave(food.id)}
                      disabled={isPending}
                      className="text-xs px-2.5 py-1 rounded-lg font-medium"
                      style={{ background: "var(--amber-glow)", color: "var(--amber)", border: "1px solid var(--border-warm)" }}
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-xs px-2.5 py-1 rounded-lg"
                      style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startEdit(food)}
                    className="text-xs px-2.5 py-1 rounded-lg"
                    style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>

            {/* Current macros (read) or edit fields */}
            {editing === food.id && editVals ? (
              <div className="grid grid-cols-4 gap-2">
                {(["kcal", "protein", "fat", "saturated_fat", "carbs", "sugar", "fiber", "salt"] as (keyof EditState)[]).map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      {key === "saturated_fat" ? "sat." : key === "protein" ? "prot" : key}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={editVals[key]}
                      onChange={(e) => setEditVals({ ...editVals, [key]: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg text-sm text-center"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        border: Number(editVals[key]) === 0 ? "1px solid rgba(255,107,107,0.4)" : "1px solid var(--border-warm)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-x-3 gap-y-1">
                {([
                  ["kcal", food.kcal, "var(--amber)"],
                  ["prot", food.protein, "#34D399"],
                  ["grasas", food.fat, "#F87171"],
                  ["sat.", food.saturated_fat, "#FBBF24"],
                  ["carbos", food.carbs, "#A8876A"],
                  ["azúcar", food.sugar, "#EC4899"],
                  ["fibra", food.fiber, "#22C55E"],
                  ["sal", food.salt, "#93C5FD"],
                ] as [string, number, string][]).map(([label, val, color]) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: val === 0 ? "rgba(255,107,107,0.7)" : color }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="glass-card-static p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {search ? "Sin resultados" : "No hay alimentos con macros incompletos"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
