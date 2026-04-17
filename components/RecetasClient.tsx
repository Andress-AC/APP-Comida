"use client";

import { useMemo, useState } from "react";
import { RecipeWithIngredients } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

interface Props {
  recipes: RecipeWithIngredients[];
  favIds: Set<string>;
}

export default function RecetasClient({ recipes, favIds }: Props) {
  const [search, setSearch] = useState("");

  const displayed = useMemo(() => {
    const q = norm(search.trim());

    if (!q) {
      // No search: favorites first, then alphabetical
      return [...recipes].sort((a, b) => {
        const af = favIds.has(a.id) ? 0 : 1;
        const bf = favIds.has(b.id) ? 0 : 1;
        if (af !== bf) return af - bf;
        return norm(a.name).localeCompare(norm(b.name));
      });
    }

    // With search: filter + rank (exact > starts-with > contains)
    const filtered = recipes.filter((r) => norm(r.name).includes(q));
    filtered.sort((a, b) => {
      const na = norm(a.name);
      const nb = norm(b.name);
      if (na === q && nb !== q) return -1;
      if (nb === q && na !== q) return 1;
      const as_ = na.startsWith(q);
      const bs_ = nb.startsWith(q);
      if (as_ && !bs_) return -1;
      if (bs_ && !as_) return 1;
      // Favorites among equals
      const af = favIds.has(a.id) ? 0 : 1;
      const bf = favIds.has(b.id) ? 0 : 1;
      if (af !== bf) return af - bf;
      return na.localeCompare(nb);
    });
    return filtered;
  }, [recipes, favIds, search]);

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Buscar receta..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input-dark w-full"
      />
      <div className="space-y-2">
        {displayed.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} isFavorite={favIds.has(recipe.id)} />
        ))}
        {displayed.length === 0 && (
          <p className="text-white/30 text-center py-8 text-sm">
            {search ? `Sin resultados para "${search}"` : "No hay recetas"}
          </p>
        )}
      </div>
    </div>
  );
}
