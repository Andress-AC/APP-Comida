"use client";

import { useMemo, useState, useTransition } from "react";
import { FoodWithUnits } from "@/lib/types";
import { FOOD_CATEGORIES, CATEGORY_ORDER, SUBCATEGORIES } from "@/lib/categories";
import FoodCard from "@/components/FoodCard";
import FoodListButton, { UserList } from "@/components/FoodListButton";
import { bulkDeleteFoods, bulkUpdateCategory, bulkUpdateSubcategory } from "@/actions/foods";
import { createList, deleteList } from "@/actions/food-lists";

type Store = "mercadona" | "consum" | "otros";

interface Props {
  foods: FoodWithUnits[];
  favIds: string[];
  isAdmin?: boolean;
  lists: UserList[];
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

export default function AlimentosClient({ foods, favIds, isAdmin = false, lists }: Props) {
  const favSet = useMemo(() => new Set(favIds), [favIds]);

  const [search, setSearch] = useState("");
  const [activeStores, setActiveStores] = useState<Set<Store>>(
    new Set(["mercadona", "consum", "otros"] as Store[])
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>("");
  // Start all collapsed to avoid rendering 4000+ cards at once
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(
    () => new Set([...FOOD_CATEGORIES, "__favs__"])
  );

  // Selection / bulk
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkSubcategory, setBulkSubcategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // List management
  const [newListName, setNewListName] = useState("");
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [listPending, startListTransition] = useTransition();

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
    setBulkSubcategory("");
    setError(null);
  }

  function handleCreateList() {
    const name = newListName.trim();
    if (!name) return;
    startListTransition(async () => {
      const result = await createList(name);
      if (result.error) setListError(result.error);
      else { setNewListName(""); setShowNewListInput(false); setListError(null); }
    });
  }

  function handleDeleteList(listId: string) {
    startListTransition(async () => {
      await deleteList(listId);
    });
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

  function handleBulkSubcategory() {
    if (!bulkSubcategory) return;
    setError(null);
    startTransition(async () => {
      const result = await bulkUpdateSubcategory(Array.from(selectedIds), bulkSubcategory);
      if (result.error) setError(result.error);
      else exitSelectionMode();
    });
  }

  // Category whose subcategories to show in bulk panel:
  // prefer the explicitly chosen bulkCategory, fall back to active categoryFilter
  const bulkSubcatSource = bulkCategory || categoryFilter;
  const bulkSubcatOptions = bulkSubcatSource
    ? (SUBCATEGORIES[bulkSubcatSource as keyof typeof SUBCATEGORIES] ?? null)
    : null;

  // ─── Filtering ──────────────────────────────────────────────────────────────
  const normSearch = norm(search.trim());

  const filtered = useMemo(() => {
    const results = foods.filter((f) => {
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

    // In search mode, rank: exact match > starts with > contains (then alphabetical)
    if (normSearch) {
      results.sort((a, b) => {
        const na = norm(a.name);
        const nb = norm(b.name);
        const aExact = na === normSearch;
        const bExact = nb === normSearch;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        const aStarts = na.startsWith(normSearch);
        const bStarts = nb.startsWith(normSearch);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;
        return na.localeCompare(nb);
      });
    }

    return results;
  }, [foods, activeStores, categoryFilter, subcategoryFilter, normSearch]);

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
                <div className="flex gap-2 items-center flex-wrap w-full">
                  {/* Bulk category */}
                  <select value={bulkCategory} onChange={(e) => { setBulkCategory(e.target.value); setBulkSubcategory(""); }} className="input-dark text-sm py-1.5" style={{ minWidth: "160px" }}>
                    <option value="">Cambiar categoría…</option>
                    {FOOD_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {bulkCategory && (
                    <button onClick={handleBulkCategory} disabled={isPending} className="px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--amber-glow)", color: "var(--amber)", border: "1px solid var(--border-warm-strong)" }}>
                      {isPending ? "Aplicando…" : "Aplicar"}
                    </button>
                  )}
                  {/* Bulk subcategory — shown when source category has subcategories */}
                  {bulkSubcatOptions && (
                    <>
                      <select value={bulkSubcategory} onChange={(e) => setBulkSubcategory(e.target.value)} className="input-dark text-sm py-1.5" style={{ minWidth: "180px" }}>
                        <option value="">Cambiar subcategoría…</option>
                        <option value="__clear__">— Sin subcategoría —</option>
                        {bulkSubcatOptions.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                      {bulkSubcategory && (
                        <button
                          onClick={() => {
                            const val = bulkSubcategory === "__clear__" ? "" : bulkSubcategory;
                            setError(null);
                            startTransition(async () => {
                              const result = await bulkUpdateSubcategory(Array.from(selectedIds), val);
                              if (result.error) setError(result.error);
                              else exitSelectionMode();
                            });
                          }}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium"
                          style={{ background: "var(--amber-glow)", color: "var(--amber)", border: "1px solid var(--border-warm-strong)" }}
                        >
                          {isPending ? "Aplicando…" : "Aplicar"}
                        </button>
                      )}
                    </>
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

      {/* ── Search mode: flat list (no category grouping) ── */}
      {normSearch && filtered.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
            Resultados ({filtered.length})
          </p>
          <div className="space-y-2">
            {filtered.slice(0, 100).map((food) => (
              <FoodCard key={food.id} food={food} isFavorite={favSet.has(food.id)}
                selectable={selectionMode} selected={selectedIds.has(food.id)} onToggle={() => toggleSelection(food.id)}
                listButton={<FoodListButton foodId={food.id} lists={lists} />}
              />
            ))}
          </div>
          {filtered.length > 100 && (
            <p className="text-sm text-center mt-3" style={{ color: "var(--text-muted)" }}>
              Mostrando 100 de {filtered.length} — afina la búsqueda para ver más
            </p>
          )}
        </section>
      )}

      {/* ── Browse mode: favorites + lists + categories (all collapsed by default) ── */}
      {!normSearch && <>

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
                <FoodCard key={`fav-${food.id}`} food={food} isFavorite selectable={selectionMode} selected={selectedIds.has(food.id)} onToggle={() => toggleSelection(food.id)}
                  listButton={<FoodListButton foodId={food.id} lists={lists} />}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* User lists */}
      {!categoryFilter && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              📂 Mis listas
            </span>
            <button
              onClick={() => { setShowNewListInput((v) => !v); setListError(null); }}
              className="text-xs px-2 py-1 rounded-lg transition-colors"
              style={{ color: "var(--amber)", background: "var(--amber-glow)", border: "1px solid var(--border-warm)" }}
            >
              + Nueva lista
            </button>
          </div>

          {showNewListInput && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateList())}
                placeholder="Nombre de la lista…"
                className="input-dark flex-1"
                autoFocus
              />
              <button
                onClick={handleCreateList}
                disabled={listPending || !newListName.trim()}
                className="btn-primary px-3"
              >
                {listPending ? "…" : "Crear"}
              </button>
            </div>
          )}
          {listError && <p className="text-xs mb-2" style={{ color: "var(--coral)" }}>{listError}</p>}

          {lists.length === 0 && !showNewListInput && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin listas creadas</p>
          )}

          {lists.map((list) => {
            const listFoods = filtered.filter((f) => list.foodIds.has(f.id));
            const key = `list-${list.id}`;
            return (
              <div key={list.id} className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() => toggleCat(key)}
                    className="flex items-center gap-1.5 flex-1 min-w-0"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="transition-transform duration-200 flex-shrink-0"
                      style={{ color: "var(--text-muted)", transform: collapsedCats.has(key) ? "rotate(-90deg)" : "rotate(0deg)" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <span className="text-xs font-semibold uppercase tracking-wider truncate" style={{ color: "var(--text-muted)" }}>
                      {list.name} ({listFoods.length})
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteList(list.id)}
                    disabled={listPending}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-xs transition-colors flex-shrink-0"
                    style={{ color: "var(--text-muted)" }}
                    title="Eliminar lista"
                  >
                    ×
                  </button>
                </div>
                {!collapsedCats.has(key) && (
                  <div className="space-y-2 pl-2" style={{ borderLeft: "2px solid var(--border-subtle)" }}>
                    {listFoods.length === 0 ? (
                      <p className="text-sm py-1" style={{ color: "var(--text-muted)" }}>Sin alimentos en esta lista</p>
                    ) : (
                      listFoods.map((food) => (
                        <FoodCard key={food.id} food={food} isFavorite={favSet.has(food.id)}
                          selectable={selectionMode} selected={selectedIds.has(food.id)} onToggle={() => toggleSelection(food.id)}
                          listButton={<FoodListButton foodId={food.id} lists={lists} />}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
                <FoodCard key={food.id} food={food} isFavorite={favSet.has(food.id)} selectable={selectionMode} selected={selectedIds.has(food.id)} onToggle={() => toggleSelection(food.id)}
                  listButton={<FoodListButton foodId={food.id} lists={lists} />}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      </> /* end browse mode */}
    </div>
  );
}
