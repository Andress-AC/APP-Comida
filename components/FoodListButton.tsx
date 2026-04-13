"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { addFoodToList, removeFoodFromList } from "@/actions/food-lists";

export interface UserList {
  id: string;
  name: string;
  foodIds: Set<string>;
}

interface Props {
  foodId: string;
  lists: UserList[];
}

export default function FoodListButton({ foodId, lists }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const inAnyList = lists.some((l) => l.foodIds.has(foodId));

  function toggle(list: UserList) {
    const inList = list.foodIds.has(foodId);
    startTransition(async () => {
      if (inList) await removeFoodFromList(list.id, foodId);
      else await addFoodToList(list.id, foodId);
    });
  }

  if (lists.length === 0) return null;

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{
          background: inAnyList ? "var(--amber-glow)" : "transparent",
          color: inAnyList ? "var(--amber)" : "var(--text-muted)",
        }}
        title="Añadir a lista"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M3 10h18M3 14h10" strokeLinecap="round" />
          <circle cx="18" cy="17" r="3" />
          <path d="M18 15v4M16 17h4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-50 rounded-xl overflow-hidden min-w-[180px]"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-warm)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-xs font-semibold uppercase tracking-wider px-3 pt-3 pb-1" style={{ color: "var(--text-muted)" }}>
            Mis listas
          </p>
          {lists.map((list) => {
            const inList = list.foodIds.has(foodId);
            return (
              <button
                key={list.id}
                type="button"
                onClick={() => toggle(list)}
                disabled={isPending}
                className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-white/5"
              >
                <span
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{
                    background: inList ? "var(--amber-glow)" : "transparent",
                    border: `1.5px solid ${inList ? "var(--amber)" : "var(--border-subtle)"}`,
                  }}
                >
                  {inList && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--amber)" }}>
                      <polyline points="2,5 4,7.5 8,2.5" />
                    </svg>
                  )}
                </span>
                <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>
                  {list.name}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
