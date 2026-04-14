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

  const filtered = useMemo(() => {
    const q = norm(search.trim());
    if (!q) return recipes;
    return recipes.filter((r) => norm(r.name).includes(q));
  }, [recipes, search]);

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
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} isFavorite={favIds.has(recipe.id)} />
        ))}
        {filtered.length === 0 && (
          <p className="text-white/30 text-center py-8 text-sm">
            {search ? `Sin resultados para "${search}"` : "No hay recetas"}
          </p>
        )}
      </div>
    </div>
  );
}
