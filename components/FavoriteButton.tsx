"use client";

import { useState } from "react";
import { toggleFavoriteFood, toggleFavoriteRecipe } from "@/actions/favorites";

interface Props {
  id: string;
  type: "food" | "recipe";
  initialFavorite: boolean;
}

export default function FavoriteButton({ id, type, initialFavorite }: Props) {
  const [isFav, setIsFav] = useState(initialFavorite);
  const [loading, setLoading] = useState(false);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    setIsFav(!isFav);
    if (type === "food") await toggleFavoriteFood(id);
    else await toggleFavoriteRecipe(id);
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      className="transition-all duration-200"
      style={{ opacity: loading ? 0.5 : 1 }}
      title={isFav ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      <svg
        width="18" height="18" viewBox="0 0 24 24"
        fill={isFav ? "var(--amber)" : "none"}
        stroke={isFav ? "var(--amber)" : "var(--text-muted)"}
        strokeWidth="1.8"
      >
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
        />
      </svg>
    </button>
  );
}
