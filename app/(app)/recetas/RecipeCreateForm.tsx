"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEAL_CATEGORIES, MealCategory } from "@/lib/types";
import { createRecipe } from "@/actions/recipes";

export default function RecipeCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categories, setCategories] = useState<MealCategory[]>(["comida", "cena"]);
  const [creating, setCreating] = useState(false);

  function toggle(cat: MealCategory) {
    const next = categories.includes(cat)
      ? categories.filter((c) => c !== cat)
      : [...categories, cat];
    if (next.length === 0) return;
    setCategories(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const result = await createRecipe(name.trim(), categories);
    if (result.id) {
      router.push(`/recetas/${result.id}`);
    }
    setCreating(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 glass-card p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Nombre de la nueva receta"
        className="input-dark w-full"
      />
      <div>
        <label className="text-sm font-medium text-white/50 uppercase tracking-wider mb-1 block">Categorías</label>
        <div className="flex flex-wrap gap-2">
          {MEAL_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggle(cat.value)}
              className={`px-3 py-1 rounded-full text-sm border transition-all duration-200 ${
                categories.includes(cat.value)
                  ? "bg-amber-500 text-black font-medium border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-white/[0.03] text-white/50 border-white/10 hover:border-amber-500/40 hover:text-white/70"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="submit"
        disabled={creating || !name.trim()}
        className="btn-sage w-full"
      >
        {creating ? "Creando..." : "Crear receta"}
      </button>
    </form>
  );
}
