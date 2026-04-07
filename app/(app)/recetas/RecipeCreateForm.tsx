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
    <form onSubmit={handleSubmit} className="space-y-3 bg-white rounded-lg border p-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Nombre de la nueva receta"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div>
        <label className="text-sm font-medium text-gray-600 mb-1 block">Categorías</label>
        <div className="flex flex-wrap gap-2">
          {MEAL_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggle(cat.value)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                categories.includes(cat.value)
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
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
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {creating ? "Creando..." : "Crear receta"}
      </button>
    </form>
  );
}
