"use client";

import { useMemo, useState } from "react";
import { FoodWithUnits, RecipeWithIngredients, MEAL_CATEGORIES, MealCategory } from "@/lib/types";
import { logFood, logRecipe } from "@/actions/daily-logs";
import FoodSelector, { FoodOption } from "@/components/FoodSelector";

interface Props {
  foods: FoodWithUnits[];
  recipes: RecipeWithIngredients[];
  favoriteFoodIds?: Set<string>;
  favoriteRecipeIds?: Set<string>;
}

function getDefaultMealType(): MealCategory {
  const hour = new Date().getHours();
  if (hour < 11) return "desayuno";
  if (hour < 14) return "comida";
  if (hour < 17) return "merienda";
  if (hour < 21) return "cena";
  return "cena";
}

export default function ManualLogForm({ foods, recipes, favoriteFoodIds, favoriteRecipeIds }: Props) {
  const [type, setType] = useState<"food" | "recipe">("food");
  const [selectedFood, setSelectedFood] = useState<FoodWithUnits | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("grams");
  const [mealType, setMealType] = useState<MealCategory>(getDefaultMealType);
  const [saving, setSaving] = useState(false);

  // Favorites first, then alphabetical
  const sortedFoods = useMemo(
    () =>
      [...foods].sort((a, b) => {
        const af = favoriteFoodIds?.has(a.id) ? 0 : 1;
        const bf = favoriteFoodIds?.has(b.id) ? 0 : 1;
        if (af !== bf) return af - bf;
        return a.name.localeCompare(b.name, "es");
      }),
    [foods, favoriteFoodIds]
  );

  const sortedRecipes = useMemo(
    () =>
      [...recipes].sort((a, b) => {
        const af = favoriteRecipeIds?.has(a.id) ? 0 : 1;
        const bf = favoriteRecipeIds?.has(b.id) ? 0 : 1;
        return af - bf;
      }),
    [recipes, favoriteRecipeIds]
  );

  function switchType(t: "food" | "recipe") {
    setType(t);
    setSelectedFood(null);
    setSelectedRecipeId("");
    setQuantity(t === "recipe" ? "1" : "");
    setUnit("grams");
  }

  async function handleSubmit() {
    setSaving(true);
    if (type === "food" && selectedFood) {
      let grams = Number(quantity);
      if (unit !== "grams") {
        const fu = selectedFood.food_units.find((u) => u.name === unit);
        if (fu) grams = fu.grams * Number(quantity);
      }
      await logFood(selectedFood.id, grams, mealType);
    } else if (type === "recipe" && selectedRecipeId) {
      await logRecipe(selectedRecipeId, Number(quantity) || 1, mealType);
    }
    setSelectedFood(null);
    setSelectedRecipeId("");
    setQuantity("");
    setUnit("grams");
    setSaving(false);
  }

  const canSubmit =
    type === "food"
      ? !!selectedFood && !!quantity
      : !!selectedRecipeId && !!quantity;

  return (
    <div className="glass-card-static p-5 space-y-4 animate-in animate-in-delay-3">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        Añadir manualmente
      </h3>

      {/* Food / Recipe tab */}
      <div className="flex gap-2">
        {(["food", "recipe"] as const).map((t) => (
          <button
            key={t}
            onClick={() => switchType(t)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: type === t ? "var(--amber-glow)" : "var(--bg-card)",
              color: type === t ? "var(--amber)" : "var(--text-muted)",
              border: `1px solid ${type === t ? "var(--border-warm-strong)" : "var(--border-subtle)"}`,
            }}
          >
            {t === "food" ? "Alimento" : "Receta"}
          </button>
        ))}
      </div>

      {/* Food search */}
      {type === "food" && (
        <>
          <FoodSelector
            foods={sortedFoods as FoodOption[]}
            onSelect={(food) => {
              setSelectedFood(food as FoodWithUnits);
              setUnit("grams");
            }}
            placeholder="Buscar alimento..."
          />
          {selectedFood && (
            <p className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--amber)", background: "var(--amber-glow)" }}>
              ✓ {selectedFood.name}
            </p>
          )}
        </>
      )}

      {/* Recipe select */}
      {type === "recipe" && (
        <select
          value={selectedRecipeId}
          onChange={(e) => setSelectedRecipeId(e.target.value)}
          className="input-dark w-full"
        >
          <option value="">Seleccionar receta...</option>
          {sortedRecipes.map((r) => (
            <option key={r.id} value={r.id}>
              {favoriteRecipeIds?.has(r.id) ? "⭐ " : ""}{r.name}
            </option>
          ))}
        </select>
      )}

      {/* Quantity + unit */}
      <div className="flex gap-2">
        <input
          type="number"
          placeholder={type === "food" ? "Cantidad" : "Multiplicador"}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="input-dark flex-1"
          min={0}
        />
        {type === "food" && (selectedFood?.food_units?.length ?? 0) > 0 && (
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="input-dark"
            style={{ width: "auto" }}
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

      {/* Meal type */}
      <select
        value={mealType}
        onChange={(e) => setMealType(e.target.value as MealCategory)}
        className="input-dark w-full"
      >
        {MEAL_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || saving}
        className="btn-sage w-full"
      >
        {saving ? "Guardando..." : "Registrar"}
      </button>
    </div>
  );
}
