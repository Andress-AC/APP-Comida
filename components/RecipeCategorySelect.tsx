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
      <label className="text-sm font-medium text-white/50 uppercase tracking-wider">Categorías</label>
      <div className="flex flex-wrap gap-2">
        {MEAL_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => toggle(cat.value)}
            className={`px-3 py-1 rounded-full text-sm border transition-all duration-200 ${
              selected.includes(cat.value)
                ? "bg-amber-500 text-black font-medium border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                : "bg-white/[0.03] text-white/50 border-white/10 hover:border-amber-500/40 hover:text-white/70"
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
          className="btn-primary"
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
