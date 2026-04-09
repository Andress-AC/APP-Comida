"use client";

import { useState } from "react";
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
  availableFoods: { id: string; name: string; brand?: string }[];
}

export default function RecipeIngredientEditor({
  recipeId,
  ingredients,
  availableFoods,
}: Props) {
  const [selectedFood, setSelectedFood] = useState("");
  const [grams, setGrams] = useState("");

  return (
    <div className="space-y-2">
      {ingredients.map((ing) => (
        <div
          key={ing.id}
          className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2"
        >
          <span className="text-white/70">
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
              className="text-red-400/60 text-sm hover:text-red-400 transition-colors"
            >
              Quitar
            </button>
          </div>
        </div>
      ))}

      <div className="flex gap-2">
        <select
          value={selectedFood}
          onChange={(e) => setSelectedFood(e.target.value)}
          className="input-dark flex-1"
        >
          <option value="">Seleccionar alimento...</option>
          {availableFoods.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}{f.brand ? ` — ${f.brand}` : ""}
            </option>
          ))}
        </select>
        <input
          type="number"
          placeholder="g"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="input-dark w-20"
        />
        <button
          onClick={async () => {
            if (selectedFood && grams) {
              await addIngredient(recipeId, selectedFood, Number(grams));
              setSelectedFood("");
              setGrams("");
            }
          }}
          className="btn-primary"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
