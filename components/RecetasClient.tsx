"use client";

import { useMemo, useState } from "react";
import { RecipeWithIngredients } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";
import { smartSearch, norm } from "@/lib/search";

interface Props {
  recipes: RecipeWithIngredients[];
  favIds: Set<string>;
}

export default function RecetasClient({ recipes, favIds }: Props) {
  const [search, setSearch] = useState("");

  const displayed = useMemo(() => {
    const q = search.trim();

    if (!q) {
      // No search: favorites first, then alphabetical
      return [...recipes].sort((a, b) => {
        const af = favIds.has(a.id) ? 0 : 1;
        const bf = favIds.has(b.id) ? 0 : 1;
        if (af !== bf) return af - bf;
        return norm(a.name).localeCompare(norm(b.name));
      });
    }

    // With search: smart word-prefix search
    return smartSearch(recipes, q, (r) => r.name, undefined, recipes.length);
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
