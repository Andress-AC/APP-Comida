"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

export interface RecipeOption {
  id: string;
  name: string;
  categories?: string[] | null;
}

interface DropdownPos { top: number; left: number; width: number; maxHeight: number; }

interface Props {
  recipes: RecipeOption[];
  favoriteIds?: Set<string>;
  onSelect: (recipe: RecipeOption) => void;
  placeholder?: string;
  /** Controlled value — name of the currently selected recipe (to show in the input) */
  value?: string;
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function RecipeSelector({
  recipes,
  favoriteIds,
  onSelect,
  placeholder = "Buscar receta...",
  value,
}: Props) {
  const [search, setSearch] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<DropdownPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartY = useRef(0);
  const touchMoved = useRef(false);

  // Sync external value changes
  useEffect(() => {
    if (value !== undefined) setSearch(value);
  }, [value]);

  // --- Ranked results ---
  const items = useMemo(() => {
    const q = norm(search.trim());

    if (!q) {
      // No search: favorites first, then alphabetical
      return [...recipes].sort((a, b) => {
        const af = favoriteIds?.has(a.id) ? 0 : 1;
        const bf = favoriteIds?.has(b.id) ? 0 : 1;
        if (af !== bf) return af - bf;
        return norm(a.name).localeCompare(norm(b.name));
      });
    }

    // With search: filter + rank
    const filtered = recipes.filter(
      (r) => norm(r.name).includes(q)
    );
    filtered.sort((a, b) => {
      const na = norm(a.name);
      const nb = norm(b.name);
      // Exact match first
      if (na === q && nb !== q) return -1;
      if (nb === q && na !== q) return 1;
      // Starts with
      const as_ = na.startsWith(q);
      const bs_ = nb.startsWith(q);
      if (as_ && !bs_) return -1;
      if (bs_ && !as_) return 1;
      // Favorites among equals
      const af = favoriteIds?.has(a.id) ? 0 : 1;
      const bf = favoriteIds?.has(b.id) ? 0 : 1;
      if (af !== bf) return af - bf;
      return na.localeCompare(nb);
    });
    return filtered.slice(0, 50);
  }, [recipes, favoriteIds, search]);

  // --- Dropdown position ---
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
    setDropPos({ top, left: rect.left + vvOffsetLeft, width: rect.width, maxHeight: maxH });
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
    function handle(e: MouseEvent) {
      const portal = document.getElementById("recipe-selector-portal");
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        !(portal && portal.contains(e.target as Node))
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const showList = open && items.length > 0 && dropPos;

  const dropdown = showList ? createPortal(
    <div
      id="recipe-selector-portal"
      style={{
        position: "fixed",
        top: dropPos!.top,
        left: dropPos!.left,
        width: dropPos!.width,
        maxHeight: dropPos!.maxHeight,
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
      {items.map((r) => {
        const isFav = favoriteIds?.has(r.id);
        return (
          <button
            key={r.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(r);
              setSearch(r.name);
              setOpen(false);
            }}
            onTouchEnd={(e) => {
              if (touchMoved.current) return;
              e.preventDefault();
              onSelect(r);
              setSearch(r.name);
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-white/5 border-b border-white/[0.04] last:border-0"
          >
            {/* icon */}
            <div
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
              style={{ background: "var(--bg-card)" }}
            >
              {isFav ? "⭐" : "🍽️"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                {r.name}
              </p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 opacity-20">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); calcPos(); }}
        onFocus={() => { setOpen(true); calcPos(); }}
        className="input-dark w-full"
        autoComplete="off"
      />
      {dropdown}
    </div>
  );
}
