"use client";

import { useMemo, useState } from "react";
import { FoodWithUnits, RecipeWithIngredients, MEAL_CATEGORIES, MealCategory } from "@/lib/types";
import { FOOD_CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import { logFood, logRecipe } from "@/actions/daily-logs";

interface Props {
  foods: FoodWithUnits[];
  recipes: RecipeWithIngredients[];
  favoriteFoodIds?: Set<string>;
  favoriteRecipeIds?: Set<string>;
}

type Store = "mercadona" | "consum" | "otros";

const STORE_LABELS: Record<Store, string> = {
  mercadona: "Mercadona",
  consum: "Consum",
  otros: "Otros",
};

function getStore(food: FoodWithUnits): Store {
  if (food.store === "mercadona") return "mercadona";
  if (food.store === "consum") return "consum";
  return "otros";
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
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("grams");
  const [mealType, setMealType] = useState<MealCategory>(getDefaultMealType);
  const [saving, setSaving] = useState(false);

  const [activeStores, setActiveStores] = useState<Set<Store>>(
    new Set(["mercadona", "consum", "otros"] as Store[])
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  function toggleStore(store: Store) {
    setActiveStores((prev) => {
      const next = new Set(prev);
      if (next.has(store)) {
        if (next.size === 1) return prev;
        next.delete(store);
      } else {
        next.add(store);
      }
      return next;
    });
  }

  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      if (!activeStores.has(getStore(f))) return false;
      if (categoryFilter && (f.category ?? "Otros") !== categoryFilter) return false;
      return true;
    });
  }, [foods, activeStores, categoryFilter]);

  // Categories present in the filtered list, in order
  const availableCategories = useMemo(() => {
    const cats = new Set(filteredFoods.map((f) => f.category ?? "Otros"));
    return FOOD_CATEGORIES.filter((c) => cats.has(c));
  }, [filteredFoods]);

  const sortedRecipes = useMemo(
    () =>
      [...recipes].sort((a, b) => {
        const aFav = favoriteRecipeIds?.has(a.id) ? 0 : 1;
        const bFav = favoriteRecipeIds?.has(b.id) ? 0 : 1;
        return aFav - bFav;
      }),
    [recipes, favoriteRecipeIds]
  );

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

  const favFoods = useMemo(
    () =>
      filteredFoods
        .filter((f) => favoriteFoodIds?.has(f.id))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [filteredFoods, favoriteFoodIds]
  );

  const nonFavByCategory = useMemo(() => {
    const cats = new Map<string, FoodWithUnits[]>();
    for (const food of filteredFoods) {
      if (favoriteFoodIds?.has(food.id)) continue;
      const cat = food.category ?? "Otros";
      if (!cats.has(cat)) cats.set(cat, []);
      cats.get(cat)!.push(food);
    }
    for (const foods of cats.values()) {
      foods.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    return cats;
  }, [filteredFoods, favoriteFoodIds]);

  return (
    <div className="glass-card-static p-5 space-y-4 animate-in animate-in-delay-3">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        Añadir manualmente
      </h3>

      <div className="flex gap-2">
        {(["food", "recipe"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setSelectedId(""); }}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: type === t ? 'var(--amber-glow)' : 'var(--bg-card)',
              color: type === t ? 'var(--amber)' : 'var(--text-muted)',
              border: `1px solid ${type === t ? 'var(--border-warm-strong)' : 'var(--border-subtle)'}`,
            }}
          >
            {t === "food" ? "Alimento" : "Receta"}
          </button>
        ))}
      </div>

      {type === "food" && (
        <>
          {/* Store filter */}
          <div className="flex gap-1.5 flex-wrap">
            {(["mercadona", "consum", "otros"] as Store[]).map((store) => (
              <button
                key={store}
                onClick={() => toggleStore(store)}
                className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200"
                style={{
                  background: activeStores.has(store) ? 'var(--amber-glow)' : 'var(--bg-card)',
                  color: activeStores.has(store) ? 'var(--amber)' : 'var(--text-muted)',
                  border: `1px solid ${activeStores.has(store) ? 'var(--border-warm-strong)' : 'var(--border-subtle)'}`,
                }}
              >
                {STORE_LABELS[store]}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setSelectedId(""); }}
            className="input-dark w-full text-sm"
          >
            <option value="">Todas las categorías</option>
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </>
      )}

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="input-dark w-full"
      >
        <option value="">Seleccionar {type === "food" ? "alimento" : "receta"}...</option>
        {type === "food" ? (
          <>
            {favFoods.length > 0 && (
              <optgroup label="⭐ Favoritos">
                {favFoods.map((f) => (
                  <option key={f.id} value={f.id}>
                    ⭐ {f.name} — {f.brand}
                  </option>
                ))}
              </optgroup>
            )}
            {FOOD_CATEGORIES.map((cat) => {
              const catFoods = nonFavByCategory.get(cat);
              if (!catFoods?.length) return null;
              return (
                <optgroup key={cat} label={cat}>
                  {catFoods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.brand}
                    </option>
                  ))}
                </optgroup>
              );
            })}
            {(() => {
              const otros = nonFavByCategory.get("Otros");
              if (!otros?.length || FOOD_CATEGORIES.includes("Otros" as any)) return null;
              return (
                <optgroup label="Otros">
                  {otros.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} — {f.brand}
                    </option>
                  ))}
                </optgroup>
              );
            })()}
          </>
        ) : (
          sortedRecipes.map((r) => (
            <option key={r.id} value={r.id}>
              {favoriteRecipeIds?.has(r.id) ? "⭐ " : ""}{r.name}
            </option>
          ))
        )}
      </select>

      <div className="flex gap-2">
        <input
          type="number"
          placeholder={type === "food" ? "Cantidad" : "Multiplicador (ej: 2)"}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="input-dark flex-1"
        />
        {type === "food" && selectedFood && (
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="input-dark"
            style={{ width: 'auto' }}
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
        className="input-dark w-full"
      >
        {MEAL_CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        disabled={!selectedId || !quantity || saving}
        className="btn-sage w-full"
      >
        {saving ? "Guardando..." : "Registrar"}
      </button>
    </div>
  );
}
