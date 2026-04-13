"use client";

import { useState, useTransition } from "react";
import FoodSelector, { FoodOption } from "./FoodSelector";
import { addToPantry } from "@/actions/pantry";

interface Props {
  foods: FoodOption[];
}

export default function DespensaAddForm({ foods }: Props) {
  const [selectedFood, setSelectedFood] = useState<FoodOption | null>(null);
  const [grams, setGrams] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!selectedFood || !grams || Number(grams) <= 0) return;
    startTransition(async () => {
      await addToPantry(selectedFood.id, Number(grams));
      setSelectedFood(null);
      setGrams("");
    });
  }

  return (
    <div className="glass-card p-4 space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        Añadir a despensa
      </h3>

      <FoodSelector
        foods={foods}
        onSelect={(f) => setSelectedFood(f)}
        placeholder="Buscar alimento..."
      />

      {selectedFood && (
        <p className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--amber)", background: "var(--amber-glow)" }}>
          Seleccionado: {selectedFood.name}
        </p>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          placeholder="Gramos"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="input-dark flex-1"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedFood || !grams || isPending}
          className="btn-primary"
        >
          {isPending ? "..." : "Añadir"}
        </button>
      </div>
    </div>
  );
}
