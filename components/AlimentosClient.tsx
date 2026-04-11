"use client";

import { useMemo, useState, useTransition } from "react";
import { FoodWithUnits } from "@/lib/types";
import { FOOD_CATEGORIES, CATEGORY_ORDER } from "@/lib/categories";
import FoodCard from "@/components/FoodCard";
import { bulkDeleteFoods, bulkUpdateCategory } from "@/actions/foods";

type Store = "mercadona" | "consum" | "otros";

interface Props {
  foods: FoodWithUnits[];
  favIds: string[];
  isAdmin?: boolean;
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

export default function AlimentosClient({ foods, favIds, isAdmin = false }: Props) {
  const favSet = useMemo(() => new Set(favIds), [favIds]);

  const [activeStores, setActiveStores] = useState<Set<Store>>(
    new Set(["mercadona", "consum", "otros"] as Store[])
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk action state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setConfirmDelete(false);
    setBulkCategory("");
    setError(null);
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((f) => f.id)));
  }

  function handleBulkDelete() {
    setError(null);
    startTransition(async () => {
      const result = await bulkDeleteFoods(Array.from(selectedIds));
      if (result.error) {
        setError(result.error);
      } else {
        exitSelectionMode();
      }
    });
  }

  function handleBulkCategory() {
    if (!bulkCategory) return;
    setError(null);
    startTransition(async () => {
      const result = await bulkUpdateCategory(Array.from(selectedIds), bulkCategory);
      if (result.error) {
        setError(result.error);
      } else {
        exitSelectionMode();
      }
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

  const selectedCount = selectedIds.size;

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
              background: activeStores.has(store) ? "var(--amber-glow)" : "var(--bg-card)",
              color: activeStores.has(store) ? "var(--amber)" : "var(--text-muted)",
              border: `1px solid ${activeStores.has(store) ? "var(--border-warm-strong)" : "var(--border-subtle)"}`,
            }}
          >
            {STORE_LABELS[store]}
          </button>
        ))}

        {/* Select mode toggle */}
        {!selectionMode ? (
          <button
            onClick={() => setSelectionMode(true)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ml-auto"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            Seleccionar
          </button>
        ) : (
          <button
            onClick={exitSelectionMode}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ml-auto"
            style={{
              background: "var(--bg-card)",
              color: "var(--text-muted)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            Cancelar
          </button>
        )}
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

      {/* Bulk action bar */}
      {selectionMode && (
        <div
          className="rounded-xl p-3 space-y-3"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-warm-strong)" }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {selectedCount === 0
                ? "Ningún alimento seleccionado"
                : `${selectedCount} seleccionado${selectedCount !== 1 ? "s" : ""}`}
            </span>
            {filtered.length > 0 && (
              <button
                onClick={selectedCount === filtered.length ? () => setSelectedIds(new Set()) : selectAll}
                className="text-xs px-2 py-1 rounded-lg transition-all"
                style={{ color: "var(--amber)", background: "var(--amber-glow)" }}
              >
                {selectedCount === filtered.length ? "Deseleccionar todo" : "Seleccionar todo"}
              </button>
            )}
          </div>

          {selectedCount > 0 && (
            <div className="flex gap-2 flex-wrap">
              {/* Delete button (all users) */}
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
                style={{
                  background: "rgba(239,68,68,0.15)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.3)",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
                Eliminar
              </button>

              {/* Change category (admin only) */}
              {isAdmin && (
                <div className="flex gap-2 items-center flex-wrap">
                  <select
                    value={bulkCategory}
                    onChange={(e) => setBulkCategory(e.target.value)}
                    className="input-dark text-sm py-1.5"
                    style={{ minWidth: "160px" }}
                  >
                    <option value="">Cambiar categoría…</option>
                    {FOOD_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {bulkCategory && (
                    <button
                      onClick={handleBulkCategory}
                      disabled={isPending}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        background: "var(--amber-glow)",
                        color: "var(--amber)",
                        border: "1px solid var(--border-warm-strong)",
                      }}
                    >
                      {isPending ? "Aplicando…" : "Aplicar"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="rounded-2xl p-6 max-w-sm w-full space-y-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-warm-strong)" }}
          >
            <h3 className="text-lg font-semibold text-white/90">
              ¿Eliminar {selectedCount} alimento{selectedCount !== 1 ? "s" : ""}?
            </h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {isAdmin
                ? "Los alimentos globales se borrarán para todos los usuarios. Los personales solo se borrarán de tu lista."
                : "Los alimentos globales se ocultarán de tu lista. Los tuyos propios se borrarán definitivamente."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: "var(--bg-card)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(239,68,68,0.2)",
                  color: "#f87171",
                  border: "1px solid rgba(239,68,68,0.4)",
                }}
              >
                {isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No hay alimentos</p>
      )}

      {/* Favorites section — only when no category filter active */}
      {favorites.length > 0 && !categoryFilter && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            ⭐ Favoritos
          </h2>
          <div className="space-y-2">
            {favorites.map((food) => (
              <FoodCard
                key={`fav-${food.id}`}
                food={food}
                isFavorite={true}
                selectable={selectionMode}
                selected={selectedIds.has(food.id)}
                onToggle={() => toggleSelection(food.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Category sections */}
      {byCategory.map(([category, categoryFoods]) => (
        <section key={category}>
          <h2
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-muted)" }}
          >
            {category}
          </h2>
          <div className="space-y-2">
            {categoryFoods.map((food) => (
              <FoodCard
                key={food.id}
                food={food}
                isFavorite={favSet.has(food.id)}
                selectable={selectionMode}
                selected={selectedIds.has(food.id)}
                onToggle={() => toggleSelection(food.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
