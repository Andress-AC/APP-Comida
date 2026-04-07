"use client";

import { useState } from "react";
import { FoodWithUnits, RecipeWithIngredients, MEAL_CATEGORIES, MealCategory } from "@/lib/types";
import { logFood, logRecipe } from "@/actions/daily-logs";

interface Props {
  foods: FoodWithUnits[];
  recipes: RecipeWithIngredients[];
}

function getDefaultMealType(): MealCategory {
  const hour = new Date().getHours();
  if (hour < 11) return "desayuno";
  if (hour < 14) return "comida";
  if (hour < 17) return "merienda";
  if (hour < 21) return "cena";
  return "cena";
}

export default function ManualLogForm({ foods, recipes }: Props) {
  const [type, setType] = useState<"food" | "recipe">("food");
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("grams");
  const [mealType, setMealType] = useState<MealCategory>(getDefaultMealType);
  const [saving, setSaving] = useState(false);

  const selectedFood = foods.find((f) => f.id === selectedId);

  async function handleSubmit() {
    if (!selectedId) return;
    setSaving(true);

    if (type === "food") {
      let grams = Number(quantity);
      if (unit !== "grams" && selectedFood) {
        const foodUnit = selectedFood.food_units.find((u) => u.name === unit);
        if (foodUnit) grams = foodUnit.grams * Number(quantity);
      }
      await logFood(selectedId, grams, mealType);
    } else {
      await logRecipe(selectedId, Number(quantity) || 1, mealType);
    }

    setSelectedId("");
    setQuantity("");
    setUnit("grams");
    setSaving(false);
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <h3 className="font-medium text-sm text-gray-600">Añadir manualmente</h3>

      <div className="flex gap-2">
        <button
          onClick={() => { setType("food"); setSelectedId(""); }}
          className={`px-3 py-1 rounded text-sm ${
            type === "food" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Alimento
        </button>
        <button
          onClick={() => { setType("recipe"); setSelectedId(""); }}
          className={`px-3 py-1 rounded text-sm ${
            type === "recipe" ? "bg-blue-600 text-white" : "bg-gray-100"
          }`}
        >
          Receta
        </button>
      </div>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      >
        <option value="">Seleccionar {type === "food" ? "alimento" : "receta"}...</option>
        {type === "food"
          ? foods.map((f) => (
              <option key={f.id} value={f.id}>{f.name} — {f.brand}</option>
            ))
          : recipes.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
      </select>

      <div className="flex gap-2">
        <input
          type="number"
          placeholder={type === "food" ? "Cantidad" : "Multiplicador (ej: 2)"}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        {type === "food" && selectedFood && (
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="grams">gramos</option>
            {selectedFood.food_units.map((u) => (
              <option key={u.id} value={u.name}>
                {u.name} ({u.grams}g)
              </option>
            ))}
          </select>
        )}
      </div>

      <select
        value={mealType}
        onChange={(e) => setMealType(e.target.value as MealCategory)}
        className="w-full rounded-lg border px-3 py-2 text-sm"
      >
        {MEAL_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        disabled={!selectedId || !quantity || saving}
        className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
      >
        {saving ? "Guardando..." : "Registrar"}
      </button>
    </div>
  );
}
