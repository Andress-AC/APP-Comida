"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { duplicateRecipe } from "@/actions/recipes";

export default function DuplicateRecipeButton({ recipeId }: { recipeId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handle() {
    setLoading(true);
    const result = await duplicateRecipe(recipeId);
    setLoading(false);
    if (result.success && result.id) {
      router.push(`/recetas/${result.id}`);
    }
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="btn-primary w-full"
    >
      {loading ? "Duplicando..." : "Duplicar receta"}
    </button>
  );
}
