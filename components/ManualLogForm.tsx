"use client";

import { useMemo, useState } from "react";
import { FoodWithUnits, RecipeWithIngredients, MEAL_CATEGORIES, MealCategory } from "@/lib/types";
import { logFood, logRecipe, logCustomMacros } from "@/actions/daily-logs";
import FoodSelector, { FoodOption } from "@/components/FoodSelector";
import RecipeSelector from "@/components/RecipeSelector";

type LogType = "food" | "recipe" | "custom";

interface Props {
  foods: FoodWithUnits[];
  recipes: RecipeWithIngredients[];
  favoriteFoodIds?: Set<string>;
  favoriteRecipeIds?: Set<string>;
  recentFoods?: FoodWithUnits[];
  /** If provided, logs are added to this date instead of today */
  date?: string;
}

function getDefaultMealType(): MealCategory {
  const hour = new Date().getHours();
  if (hour < 11) return "desayuno";
  if (hour < 14) return "comida";
  if (hour < 17) return "merienda";
  if (hour < 21) return "cena";
  return "cena";
}

export default function ManualLogForm({ foods, recipes, favoriteFoodIds, favoriteRecipeIds, recentFoods = [], date }: Props) {
  const [type, setType] = useState<LogType>("food");
  const [selectedFood, setSelectedFood] = useState<FoodWithUnits | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [selectedRecipeName, setSelectedRecipeName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("grams");
  const [mealType, setMealType] = useState<MealCategory>(getDefaultMealType);
  const [saving, setSaving] = useState(false);

  // Custom entry fields
  const [customName, setCustomName] = useState("");
  const [customKcal, setCustomKcal] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFiber, setCustomFiber] = useState("");

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

  function switchType(t: LogType) {
    setType(t);
    setSelectedFood(null);
    setSelectedRecipeId("");
    setSelectedRecipeName("");
    setQuantity(t === "recipe" ? "1" : "");
    setUnit("grams");
  }

  function resetForm() {
    setSelectedFood(null);
    setSelectedRecipeId("");
    setSelectedRecipeName("");
    setQuantity("");
    setUnit("grams");
    setCustomName("");
    setCustomKcal("");
    setCustomProtein("");
    setCustomFat("");
    setCustomCarbs("");
    setCustomFiber("");
  }

  async function handleSubmit() {
    setSaving(true);
    if (type === "food" && selectedFood) {
      let grams = Number(quantity);
      if (unit !== "grams") {
        const fu = selectedFood.food_units.find((u) => u.name === unit);
        if (fu) grams = fu.grams * Number(quantity);
      }
      await logFood(selectedFood.id, grams, mealType, date);
    } else if (type === "recipe" && selectedRecipeId) {
      await logRecipe(selectedRecipeId, Number(quantity) || 1, mealType, date);
    } else if (type === "custom" && customKcal) {
      await logCustomMacros(
        customName,
        Number(customKcal),
        customProtein ? Number(customProtein) : null,
        customFat ? Number(customFat) : null,
        customCarbs ? Number(customCarbs) : null,
        customFiber ? Number(customFiber) : null,
        mealType,
        date,
      );
    }
    resetForm();
    setSaving(false);
  }

  const canSubmit =
    type === "food" ? !!selectedFood && !!quantity
    : type === "recipe" ? !!selectedRecipeId && !!quantity
    : !!customKcal;

  const TABS: { key: LogType; label: string }[] = [
    { key: "food", label: "Alimento" },
    { key: "recipe", label: "Receta" },
    { key: "custom", label: "Macros" },
  ];

  return (
    <div className="glass-card-static p-5 space-y-4 animate-in animate-in-delay-3">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
        Añadir{date ? ` al ${date}` : " manualmente"}
      </h3>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchType(key)}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1"
            style={{
              background: type === key ? "var(--amber-glow)" : "var(--bg-card)",
              color: type === key ? "var(--amber)" : "var(--text-muted)",
              border: `1px solid ${type === key ? "var(--border-warm-strong)" : "var(--border-subtle)"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Food search */}
      {type === "food" && (
        <>
          {recentFoods.length > 0 && !selectedFood && (
            <div>
              <p className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>Recientes</p>
              <div className="flex gap-1.5 flex-wrap">
                {recentFoods.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => { setSelectedFood(f); setUnit("grams"); }}
                    className="text-xs px-2.5 py-1 rounded-full transition-all"
                    style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <FoodSelector
            foods={sortedFoods as FoodOption[]}
            onSelect={(food) => { setSelectedFood(food as FoodWithUnits); setUnit("grams"); }}
            placeholder="Buscar alimento..."
          />
          {selectedFood && (
            <p className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--amber)", background: "var(--amber-glow)" }}>
              ✓ {selectedFood.name}
            </p>
          )}
        </>
      )}

      {/* Recipe search */}
      {type === "recipe" && (
        <>
          <RecipeSelector
            recipes={sortedRecipes}
            favoriteIds={favoriteRecipeIds}
            value={selectedRecipeName}
            onSelect={(r) => { setSelectedRecipeId(r.id); setSelectedRecipeName(r.name); }}
            placeholder="Buscar receta..."
          />
          {selectedRecipeId && (
            <p className="text-xs px-2 py-1 rounded-lg" style={{ color: "var(--amber)", background: "var(--amber-glow)" }}>
              ✓ {selectedRecipeName}
            </p>
          )}
        </>
      )}

      {/* Custom macro entry */}
      {type === "custom" && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Para cuando no sabes el alimento exacto pero puedes aproximar los macros.
          </p>
          <input
            type="text"
            placeholder='Descripción (ej: "Cena restaurante")'
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="input-dark w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Calorías *</label>
              <input type="number" placeholder="kcal" min="0" value={customKcal} onChange={(e) => setCustomKcal(e.target.value)} className="input-dark w-full" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Proteínas</label>
              <input type="number" placeholder="g" min="0" value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} className="input-dark w-full" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Grasas</label>
              <input type="number" placeholder="g" min="0" value={customFat} onChange={(e) => setCustomFat(e.target.value)} className="input-dark w-full" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Carbohidratos</label>
              <input type="number" placeholder="g" min="0" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} className="input-dark w-full" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Fibra</label>
              <input type="number" placeholder="g" min="0" value={customFiber} onChange={(e) => setCustomFiber(e.target.value)} className="input-dark w-full" />
            </div>
          </div>
        </div>
      )}

      {/* Quantity + unit (food/recipe only) */}
      {type !== "custom" && (
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
              {selectedFood?.food_units.map((u) => (
                <option key={u.id} value={u.name}>{u.name} ({u.grams}g)</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Meal type */}
      <select
        value={mealType}
        onChange={(e) => setMealType(e.target.value as MealCategory)}
        className="input-dark w-full"
      >
        {MEAL_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
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
