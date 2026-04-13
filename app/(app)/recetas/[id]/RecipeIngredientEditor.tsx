"use client";

import { useState, useTransition } from "react";
import FoodSelector, { FoodOption } from "@/components/FoodSelector";
import { addIngredient, removeIngredient, updateIngredient } from "@/actions/recipes";

interface Ingredient {
  id: string;
  food_id: string;
  quantity_grams: number;
  food: { name: string };
}

interface Props {
  recipeId: string;
  ingredients: Ingredient[];
  availableFoods: FoodOption[];
}

export default function RecipeIngredientEditor({
  recipeId,
  ingredients,
  availableFoods,
}: Props) {
  const [selectedFood, setSelectedFood] = useState<FoodOption | null>(null);
  const [grams, setGrams] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!selectedFood || !grams || Number(grams) <= 0) return;
    startTransition(async () => {
      await addIngredient(recipeId, selectedFood.id, Number(grams));
      setSelectedFood(null);
      setGrams("");
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
          onSelect={setSelectedFood}
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
            placeholder="Gramos"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="input-dark flex-1"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!selectedFood || !grams || isPending}
            className="btn-primary"
          >
            {isPending ? "..." : "Añadir"}
          </button>
        </div>
      </div>
    </div>
  );
}
