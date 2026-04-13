"use client";

import { useMemo, useState, useTransition } from "react";
import { FoodWithUnits } from "@/lib/types";
import { FOOD_CATEGORIES, CATEGORY_ORDER, SUBCATEGORIES } from "@/lib/categories";
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

// ─── Accent normalization ────────────────────────────────────────────────────
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// ─── Bigram similarity for fuzzy suggestions ─────────────────────────────────
function bigrams(s: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < s.length - 1; i++) out.push(s.slice(i, i + 2));
  return out;
}

function similarity(a: string, b: string): number {
  const ab = bigrams(a);
  const bb = new Set(bigrams(b));
  if (!ab.length || !bb.size) return 0;
  const overlap = ab.filter((bg) => bb.has(bg)).length;
  return (2 * overlap) / (ab.length + bb.size);
}

export default function AlimentosClient({ foods, favIds, isAdmin = false }: Props) {
  const favSet = useMemo(() => new Set(favIds), [favIds]);

  const [search, setSearch] = useState("");
  const [activeStores, setActiveStores] = useState<Set<Store>>(
    new Set(["mercadona", "consum", "otros"] as Store[])
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  // Selection / bulk
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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

  function toggleCat(cat: string) {
    setCollapsedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
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

  function handleBulkDelete() {
    setError(null);
    startTransition(async () => {
      const result = await bulkDeleteFoods(Array.from(selectedIds));
      if (result.error) setError(result.error);
      else exitSelectionMode();
    });
  }

  function handleBulkCategory() {
    if (!bulkCategory) return;
    setError(null);
    startTransition(async () => {
      const result = await bulkUpdateCategory(Array.from(selectedIds), bulkCategory);
      if (result.error) setError(result.error);
      else exitSelectionMode();
    });
  }

  // ─── Filtering ──────────────────────────────────────────────────────────────
  const normSearch = norm(search.trim());

  const filtered = useMemo(() => {
    return foods.filter((f) => {
      if (!activeStores.has(getStore(f))) return false;
      if (categoryFilter && (f.category ?? "Otros") !== categoryFilter) return false;
      if (subcategoryFilter && (f.subcategory ?? "") !== subcategoryFilter) return false;
      if (normSearch) {
        return (
          norm(f.name).includes(normSearch) ||
          norm(f.brand ?? "").includes(normSearch)
        );
      }
      return true;
    });
  }, [foods, activeStores, categoryFilter, normSearch]);

  // Fuzzy suggestion when no results
  const suggestion = useMemo(() => {
    if (!normSearch || filtered.length > 0) return null;
    let best: { food: FoodWithUnits; score: number } | null = null;
    for (const f of foods) {
      const score = similarity(normSearch, norm(f.name));
      if (!best || score > best.score) best = { food: f, score };
    }
    if (best && best.score > 0.25) return best.food.name;
    return null;
  }, [normSearch, filtered, foods]);

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
    for (const list of map.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    }
    return [...map.entries()].sort(
      ([a], [b]) => (CATEGORY_ORDER[a] ?? 999) - (CATEGORY_ORDER[b] ?? 999)
    );
  }, [filtered]);

  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="search"
        placeholder="Buscar alimento..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-dark w-full"
      />

      {/* Fuzzy suggestion */}
      {suggestion && (
        <button
          className="text-sm px-3 py-2 rounded-xl w-full text-left transition-colors"
          style={{
            background: "var(--amber-glow)",
            color: "var(--amber)",
            border: "1px solid var(--border-warm)",
          }}
          onClick={() => setSearch(suggestion)}
        >
          ¿Quisiste decir &ldquo;<strong>{suggestion}</strong>&rdquo;?
        </button>
      )}

      {/* Store filter + selection toggle */}
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

        {!selectionMode ? (
          isAdmin && (
            <button
              onClick={() => setSelectionMode(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ml-auto"
              style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
            >
              Seleccionar
            </button>
          )
        ) : (
          <button
            onClick={exitSelectionMode}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ml-auto"
            style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Category filter */}
      <select
        value={categoryFilter}
        onChange={(e) => { setCategoryFilter(e.target.value); setSubcategoryFilter(""); }}
        className="input-dark w-full"
      >
        <option value="">Todas las categorías</option>
        {availableCategories.map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      {/* Subcategory filter — only when category has subcategories */}
      {categoryFilter && SUBCATEGORIES[categoryFilter as keyof typeof SUBCATEGORIES] && (
        <select
          value={subcategoryFilter}
          onChange={(e) => setSubcategoryFilter(e.target.value)}
          className="input-dark w-full"
        >
          <option value="">Todas las subcategorías</option>
          {SUBCATEGORIES[categoryFilter as keyof typeof SUBCATEGORIES]!.map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
      )}

      {/* Bulk action bar */}
      {selectionMode && (
        <div className="rounded-xl p-3 space-y-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-warm-strong)" }}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
              {selectedCount === 0 ? "Ninguno seleccionado" : `${selectedCount} seleccionado${selectedCount !== 1 ? "s" : ""}`}
            </span>
            {filtered.length > 0 && (
              <button
                onClick={selectedCount === filtered.length ? () => setSelectedIds(new Set()) : () => setSelectedIds(new Set(filtered.map((f) => f.id)))}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ color: "var(--amber)", background: "var(--amber-glow)" }}
              >
                {selectedCount === filtered.length ? "Deseleccionar todo" : "Seleccionar todo"}
              </button>
            )}
          </div>
          {selectedCount > 0 && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                Eliminar
              </button>
              {isAdmin && (
                <div className="flex gap-2 items-center flex-wrap">
                  <select value={bulkCategory} onChange={(e) => setBulkCategory(e.target.value)} className="input-dark text-sm py-1.5" style={{ minWidth: "160px" }}>
                    <option value="">Cambiar categoría…</option>
                    {FOOD_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {bulkCategory && (
                    <button onClick={handleBulkCategory} disabled={isPending} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--amber-glow)", color: "var(--amber)", border: "1px solid var(--border-warm-strong)" }}>
                      {isPending ? "Aplicando…" : "Aplicar"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          {error && <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-2xl p-6 max-w-sm w-full space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-warm-strong)" }}>
            <h3 className="text-lg font-semibold text-white/90">¿Eliminar {selectedCount} alimento{selectedCount !== 1 ? "s" : ""}?</h3>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {isAdmin ? "Los alimentos globales se borrarán para todos. Los personales solo de tu lista." : "Los globales se ocultarán. Los tuyos propios se borrarán."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>Cancelar</button>
              <button onClick={handleBulkDelete} disabled={isPending} className="flex-1 px-4 py-2 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.2)", color: "#f87171", border: "1px solid rgba(239,68,68,0.4)" }}>
                {isPending ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 && !suggestion && (
        <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>No hay alimentos</p>
      )}

      {/* Favorites */}
      {favorites.length > 0 && !categoryFilter && (
        <section>
          <button
            onClick={() => toggleCat("__favs__")}
            className="flex items-center justify-between w-full mb-2 group"
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              ⭐ Favoritos ({favorites.length})
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="transition-transform duration-200"
              style={{ color: "var(--text-muted)", transform: collapsedCats.has("__favs__") ? "rotate(-90deg)" : "rotate(0deg)" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {!collapsedCats.has("__favs__") && (
            <div className="space-y-2">
              {favorites.map((food) => (
                <FoodCard key={`fav-${food.id}`} food={food} isFavorite selectable={selectionMode} selected={selectedIds.has(food.id)} onToggle={() => toggleSelection(food.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories */}
      {byCategory.map(([category, catFoods]) => (
        <section key={category}>
          <button
            onClick={() => toggleCat(category)}
            className="flex items-center justify-between w-full mb-2 group"
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              {category} ({catFoods.length})
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="transition-transform duration-200"
              style={{ color: "var(--text-muted)", transform: collapsedCats.has(category) ? "rotate(-90deg)" : "rotate(0deg)" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {!collapsedCats.has(category) && (
            <div className="space-y-2">
              {catFoods.map((food) => (
                <FoodCard key={food.id} food={food} isFavorite={favSet.has(food.id)} selectable={selectionMode} selected={selectedIds.has(food.id)} onToggle={() => toggleSelection(food.id)} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
