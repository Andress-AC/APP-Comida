"use client";

import { useState, useTransition } from "react";
import FoodSelector, { FoodOption } from "./FoodSelector";
import { addToPantry } from "@/actions/pantry";

interface FoodUnit { id: string; name: string; grams: number; }
interface FoodWithUnits extends FoodOption { food_units?: FoodUnit[]; }

interface Props {
  foods: FoodWithUnits[];
}

export default function DespensaAddForm({ foods }: Props) {
  const [selectedFood, setSelectedFood] = useState<FoodWithUnits | null>(null);
  const [qty, setQty] = useState("");
  const [unitId, setUnitId] = useState("grams");
  const [isPending, startTransition] = useTransition();

  function handleSelect(f: FoodOption) {
    setSelectedFood(f as FoodWithUnits);
    setUnitId("grams");
    setQty("");
  }

  function resolveGrams(): number {
    const n = Number(qty);
    if (unitId === "grams") return n;
    const u = selectedFood?.food_units?.find((u) => u.id === unitId);
    return u ? u.grams * n : n;
  }

  function handleSubmit() {
    if (!selectedFood || !qty || Number(qty) <= 0) return;
    const grams = resolveGrams();
    startTransition(async () => {
      await addToPantry(selectedFood.id, grams);
      setSelectedFood(null);
      setQty("");
      setUnitId("grams");
    });
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Añadir a despensa
      </h3>

      <FoodSelector
        foods={foods}
        onSelect={handleSelect}
        placeholder="Buscar alimento..."
      />

      {selectedFood && (
        <p className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--amber)", background: "var(--amber-glow)" }}>
          ✓ {selectedFood.name}
        </p>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          placeholder="Cantidad"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="input-dark flex-1"
        />
        {selectedFood && (selectedFood.food_units?.length ?? 0) > 0 && (
          <select
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            className="input-dark"
            style={{ width: "auto" }}
          >
            <option value="grams">g</option>
            {selectedFood.food_units!.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.grams}g)
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFood || !qty || isPending}
          className="btn-primary"
        >
          {isPending ? "..." : "Añadir"}
        </button>
      </div>
    </div>
  );
}
