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
          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
        >
          <span>
            {ing.food.name} — {ing.quantity_grams}g
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              defaultValue={ing.quantity_grams}
              className="w-20 rounded border px-2 py-1 text-sm"
              onBlur={async (e) => {
                const val = Number(e.target.value);
                if (val > 0 && val !== ing.quantity_grams) {
                  await updateIngredient(ing.id, recipeId, val);
                }
              }}
            />
            <button
              onClick={() => removeIngredient(ing.id, recipeId)}
              className="text-red-500 text-sm hover:underline"
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
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
          className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={async () => {
            if (selectedFood && grams) {
              await addIngredient(recipeId, selectedFood, Number(grams));
              setSelectedFood("");
              setGrams("");
            }
          }}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
