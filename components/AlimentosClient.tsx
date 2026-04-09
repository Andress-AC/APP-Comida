"use client";

import { useMemo, useState } from "react";
import { FoodWithUnits } from "@/lib/types";
import { FOOD_CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import FoodCard from "@/components/FoodCard";

type Store = "mercadona" | "consum" | "otros";

interface Props {
  foods: FoodWithUnits[];
  favIds: string[];
}

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

export default function AlimentosClient({ foods, favIds }: Props) {
  const favSet = useMemo(() => new Set(favIds), [favIds]);

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

  const filtered = useMemo(
    () => foods.filter((f) => {
      if (!activeStores.has(getStore(f))) return false;
      if (categoryFilter && (f.category ?? "Otros") !== categoryFilter) return false;
      return true;
    }),
    [foods, activeStores, categoryFilter]
  );

  // Categories present after store filter (for the dropdown options)
  const availableCategories = useMemo(() => {
    const storeFiltered = foods.filter((f) => activeStores.has(getStore(f)));
    const cats = new Set(storeFiltered.map((f) => f.category ?? "Otros"));
    return FOOD_CATEGORIES.filter((c) => cats.has(c));
  }, [foods, activeStores]);

  const favorites = useMemo(
    () =>
      filtered
        .filter((f) => favSet.has(f.id))
        .sort((a, b) => a.name.localeCompare(b.name, "es")),
    [filtered, favSet]
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, FoodWithUnits[]>();
    for (const food of filtered) {
      const cat = food.category ?? "Otros";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(food);
    }
    for (const foods of map.values()) {
      foods.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    return [...map.entries()].sort(([a], [b]) => {
      return (CATEGORY_ORDER[a] ?? 999) - (CATEGORY_ORDER[b] ?? 999);
    });
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Store filter */}
      <div className="flex gap-2 flex-wrap">
        {(["mercadona", "consum", "otros"] as Store[]).map((store) => (
          <button
            key={store}
            onClick={() => toggleStore(store)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
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
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="input-dark w-full"
      >
        <option value="">Todas las categorías</option>
        {availableCategories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {filtered.length === 0 && (
        <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No hay alimentos</p>
      )}

      {/* Favorites section — only when no category filter active */}
      {favorites.length > 0 && !categoryFilter && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            ⭐ Favoritos
          </h2>
          <div className="space-y-2">
            {favorites.map((food) => (
              <FoodCard key={`fav-${food.id}`} food={food} isFavorite={true} />
            ))}
          </div>
        </section>
      )}

      {/* Category sections */}
      {byCategory.map(([category, categoryFoods]) => (
        <section key={category}>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: 'var(--text-muted)' }}
          >
            {category}
          </h2>
          <div className="space-y-2">
            {categoryFoods.map((food) => (
              <FoodCard key={food.id} food={food} isFavorite={favSet.has(food.id)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
