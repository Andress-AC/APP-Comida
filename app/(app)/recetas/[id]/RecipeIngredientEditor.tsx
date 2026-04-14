"use client";

import { useState, useTransition } from "react";
import FoodSelector, { FoodOption } from "@/components/FoodSelector";
import { addIngredient, removeIngredient, updateIngredient } from "@/actions/recipes";

interface FoodUnit {
  id: string;
  name: string;
  grams: number;
}

interface FoodWithUnits extends FoodOption {
  food_units: FoodUnit[];
}

interface Ingredient {
  id: string;
  food_id: string;
  quantity_grams: number;
  food: { name: string };
}

interface Props {
  recipeId: string;
  ingredients: Ingredient[];
  availableFoods: FoodWithUnits[];
}

export default function RecipeIngredientEditor({
  recipeId,
  ingredients,
  availableFoods,
}: Props) {
  const [selectedFood, setSelectedFood] = useState<FoodWithUnits | null>(null);
  const [qty, setQty] = useState("");
  const [unitId, setUnitId] = useState("grams");
  const [isPending, startTransition] = useTransition();

  function handleSelect(food: FoodOption) {
    setSelectedFood(food as FoodWithUnits);
    setUnitId("grams");
    setQty("");
  }

  function resolveGrams(): number {
    const n = Number(qty);
    if (unitId === "grams") return n;
    const u = selectedFood?.food_units.find((u) => u.id === unitId);
    return u ? u.grams * n : n;
  }

  function handleAdd() {
    if (!selectedFood || !qty || Number(qty) <= 0) return;
    const grams = resolveGrams();
    startTransition(async () => {
      await addIngredient(recipeId, selectedFood.id, grams);
      setSelectedFood(null);
      setQty("");
      setUnitId("grams");
    });
  }

  return (
    <div className="space-y-2">
      {ingredients.map((ing) => (
        <div
          key={ing.id}
          className="flex items-center justify-between rounded-xl px-3 py-2"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <span style={{ color: "var(--text-secondary)" }}>
            {ing.food.name} — {ing.quantity_grams}g
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              defaultValue={ing.quantity_grams}
              className="input-dark w-20 !py-1 !px-2"
              onBlur={async (e) => {
                const val = Number(e.target.value);
                if (val > 0 && val !== ing.quantity_grams) {
                  await updateIngredient(ing.id, recipeId, val);
                }
              }}
            />
            <button
              onClick={() => removeIngredient(ing.id, recipeId)}
              className="text-sm transition-colors"
              style={{ color: "var(--coral)" }}
            >
              Quitar
            </button>
          </div>
        </div>
      ))}

      <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <FoodSelector
          foods={availableFoods}
          onSelect={handleSelect}
          placeholder="Buscar ingrediente..."
        />
        {selectedFood && (
          <p className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--amber)", background: "var(--amber-glow)" }}>
            {selectedFood.name}
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Cantidad"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="input-dark flex-1"
            min={0}
          />
          {selectedFood && (
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="input-dark"
              style={{ width: "auto" }}
            >
              <option value="grams">g</option>
              {selectedFood.food_units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.grams}g)
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedFood || !qty || isPending}
            className="btn-primary"
          >
            {isPending ? "..." : "Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}
