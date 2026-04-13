import Link from "next/link";
import { FoodWithUnits } from "@/lib/types";
import FavoriteButton from "./FavoriteButton";
import { ReactNode } from "react";

interface Props {
  food: FoodWithUnits;
  isFavorite?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
  listButton?: ReactNode;
}

export default function FoodCard({
  food,
  isFavorite = false,
  selectable = false,
  selected = false,
  onToggle,
}: Props) {
  const inner = (
    <div className="flex items-center gap-3">
      {selectable && (
        <div
          className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
          style={{
            borderColor: selected ? "var(--amber)" : "var(--border-subtle)",
            background: selected ? "var(--amber-glow)" : "transparent",
          }}
        >
          {selected && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: "var(--amber)" }}>
              <polyline points="2,6 5,9 10,3" />
            </svg>
          )}
        </div>
      )}
      {food.image_url ? (
        <img
          src={food.image_url}
          alt={food.name}
          className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0"
          style={{ color: "var(--amber)", opacity: 0.5 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 6h18M3 6v14a2 2 0 002 2h14a2 2 0 002-2V6M3 6l3-4h12l3 4M12 10v8M8 14h8"/>
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white/90 truncate">{food.name}</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--amber)", opacity: 0.6 }}>{food.brand}</p>
        <p className="text-sm text-white/40 mt-0.5">
          {food.kcal} kcal · {food.protein}g prot · {food.fat}g grasa · {food.carbs}g carbs
        </p>
      </div>
      {!selectable && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {listButton}
          <FavoriteButton id={food.id} type="food" initialFavorite={isFavorite} />
        </div>
      )}
    </div>
  );

  if (selectable) {
    return (
      <div id={`food-${food.id}`}>
        <button
          type="button"
          onClick={onToggle}
          className="block w-full text-left glass-card p-4 transition-all duration-300"
          style={{
            borderColor: selected ? "var(--border-warm-strong)" : undefined,
            background: selected ? "var(--amber-glow)" : undefined,
          }}
        >
          {inner}
        </button>
      </div>
    );
  }

  return (
    <div id={`food-${food.id}`}>
      <Link
        href={`/alimentos/${food.id}`}
        className="block glass-card p-4 hover:border-amber-500/40 transition-all duration-300"
      >
        {inner}
      </Link>
    </div>
  );
}
