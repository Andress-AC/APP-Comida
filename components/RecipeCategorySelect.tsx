"use client";

import { useState } from "react";
import { MEAL_CATEGORIES, MealCategory } from "@/lib/types";
import { updateRecipeCategories } from "@/actions/recipes";

interface Props {
  recipeId?: string;
  initial: MealCategory[];
  onChange?: (categories: MealCategory[]) => void;
}

export default function RecipeCategorySelect({ recipeId, initial, onChange }: Props) {
  const [selected, setSelected] = useState<MealCategory[]>(initial);
  const [saving, setSaving] = useState(false);

  function toggle(cat: MealCategory) {
    const next = selected.includes(cat)
      ? selected.filter((c) => c !== cat)
      : [...selected, cat];
    if (next.length === 0) return; // must have at least one
    setSelected(next);
    onChange?.(next);
  }

  async function handleSave() {
    if (!recipeId) return;
    setSaving(true);
    await updateRecipeCategories(recipeId, selected);
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-600">Categorías</label>
      <div className="flex flex-wrap gap-2">
        {MEAL_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => toggle(cat.value)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              selected.includes(cat.value)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {recipeId && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "..." : "Guardar categorías"}
        </button>
      )}
      {!recipeId && (
        <input type="hidden" name="categories" value={JSON.stringify(selected)} />
      )}
    </div>
  );
}
