"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { FOOD_CATEGORIES } from "@/lib/categories";

export interface FoodOption {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  store: string | null;
  image_url?: string | null;
}

interface DropdownPos { top: number; left: number; width: number; maxHeight: number; above: boolean; }

interface Props {
  foods: FoodOption[];
  onSelect: (food: FoodOption) => void;
  placeholder?: string;
  showCategoryFilter?: boolean;
}

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  const [dropPos, setDropPos] = useState<DropdownPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Search with ranked results: exact > starts-with > contains ---
  const filtered = useMemo(() => {
    if (!search.trim() && !categoryFilter) return [];
    const q = normalize(search.trim());

    const results = foods.filter((f) => {
      if (categoryFilter && (f.category ?? "Otros") !== categoryFilter) return false;
      if (q) return normalize(f.name).includes(q) || normalize(f.brand ?? "").includes(q);
      return true;
    });

    if (q) {
      results.sort((a, b) => {
        const na = normalize(a.name);
        const nb = normalize(b.name);
        // 1. Exact match
        const aExact = na === q;
        const bExact = nb === q;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        // 2. Starts with query
        const aStarts = na.startsWith(q);
        const bStarts = nb.startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (bStarts && !aStarts) return 1;
        // 3. Alphabetical
        return na.localeCompare(nb);
      });
    }

    return results.slice(0, 60);
  }, [foods, search, categoryFilter]);

  // --- Dropdown position: accounts for visualViewport offset (mobile keyboard) ---
  const calcPos = useCallback(() => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const vv = window.visualViewport;
    const vvh = vv?.height ?? window.innerHeight;
    const vvOffsetTop = vv?.offsetTop ?? 0;
    const vvOffsetLeft = vv?.offsetLeft ?? 0;
    const spaceBelow = vvh - rect.bottom - 8;
    const spaceAbove = rect.top - vvOffsetTop - 8;
    const above = spaceAbove > spaceBelow && spaceAbove > 120;
    const maxH = Math.min(260, (above ? spaceAbove : spaceBelow) - 4);
    const top = above
      ? rect.top + vvOffsetTop - maxH - 4
      : rect.bottom + vvOffsetTop + 4;
    setDropPos({
      top,
      left: rect.left + vvOffsetLeft,
      width: rect.width,
      maxHeight: maxH,
      above,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    calcPos();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", calcPos);
    vv?.addEventListener("scroll", calcPos);
    window.addEventListener("scroll", calcPos, true);
    return () => {
      vv?.removeEventListener("resize", calcPos);
      vv?.removeEventListener("scroll", calcPos);
      window.removeEventListener("scroll", calcPos, true);
    };
  }, [open, calcPos]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById("food-selector-portal");
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // --- Touch scroll detection: don't select if user was scrolling ---
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);

  const dropdown = open && filtered.length > 0 && dropPos ? createPortal(
    <div
      id="food-selector-portal"
      style={{
        position: "fixed",
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        maxHeight: dropPos.maxHeight,
        overflowY: "auto",
        zIndex: 9999,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-warm)",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        WebkitOverflowScrolling: "touch",
      }}
      onTouchStart={(e) => {
        touchStartY.current = e.touches[0].clientY;
        touchMoved.current = false;
      }}
      onTouchMove={(e) => {
        if (Math.abs(e.touches[0].clientY - touchStartY.current) > 8) {
          touchMoved.current = true;
        }
      }}
    >
      {filtered.map((f) => (
        <button
          key={f.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(f);
            setSearch(f.name);
            setOpen(false);
          }}
          onTouchEnd={(e) => {
            if (touchMoved.current) return; // user was scrolling, ignore
            e.preventDefault();
            onSelect(f);
            setSearch(f.name);
            setOpen(false);
          }}
          className="w-full text-left px-3 py-2.5 transition-colors hover:bg-white/5 flex items-center gap-2.5 border-b border-white/[0.04] last:border-0"
        >
          {f.image_url ? (
            <img src={f.image_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" style={{ opacity: 0.9 }} />
          ) : (
            <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: "var(--bg-card)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{f.name}</p>
            {f.brand && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{f.brand}</p>}
          </div>
          {/* Tap hint on the right — helps mobile users know they can tap */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 opacity-20">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  const noResults = open && search.trim().length > 0 && filtered.length === 0 && dropPos ? createPortal(
    <div
      style={{
        position: "fixed",
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 9999,
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "12px 16px",
        fontSize: "14px",
        color: "var(--text-muted)",
      }}
    >
      Sin resultados para &ldquo;{search}&rdquo;
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className="space-y-2">
      {showCategoryFilter && (
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); if (e.target.value) { setOpen(true); calcPos(); } }}
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
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); calcPos(); }}
          onFocus={() => { if (search || categoryFilter) { setOpen(true); calcPos(); } }}
          className="input-dark w-full"
          autoComplete="off"
        />
      </div>

      {dropdown}
      {noResults}
    </div>
  );
}
