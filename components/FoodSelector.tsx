"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { FOOD_CATEGORIES } from "@/lib/categories";

export interface FoodOption {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  store: string | null;
}

interface Props {
  foods: FoodOption[];
  /** Called when user selects a food */
  onSelect: (food: FoodOption) => void;
  placeholder?: string;
  /** Show category dropdown */
  showCategoryFilter?: boolean;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function FoodSelector({
  foods,
  onSelect,
  placeholder = "Buscar alimento...",
  showCategoryFilter = true,
}: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim() && !categoryFilter) return [];

    const q = normalize(search.trim());

    return foods
      .filter((f) => {
        if (categoryFilter && (f.category ?? "Otros") !== categoryFilter) return false;
        if (q) {
          return (
            normalize(f.name).includes(q) ||
            normalize(f.brand ?? "").includes(q)
          );
        }
        return true;
      })
      .slice(0, 60);
  }, [foods, search, categoryFilter]);

  return (
    <div ref={containerRef} className="space-y-2">
      {showCategoryFilter && (
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            if (e.target.value) setOpen(true);
          }}
          className="input-dark w-full"
        >
          <option value="">Todas las categorías</option>
          {FOOD_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}

      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (search || categoryFilter) setOpen(true);
          }}
          className="input-dark w-full"
          autoComplete="off"
        />

        {open && filtered.length > 0 && (
          <div
            className="absolute z-50 w-full mt-1 rounded-xl overflow-y-auto max-h-60"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-warm)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {filtered.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseDown={(e) => {
                  // Use mousedown so blur doesn't close before click fires
                  e.preventDefault();
                  onSelect(f);
                  setSearch(f.name);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 transition-colors hover:bg-white/5"
              >
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {f.name}
                </p>
                {f.brand && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {f.brand}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        {open && search.trim().length > 0 && filtered.length === 0 && (
          <div
            className="absolute z-50 w-full mt-1 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            Sin resultados para &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
