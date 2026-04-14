import { createClient } from "@/lib/supabase/server";
import { RecipeWithIngredients } from "@/lib/types";
import RecetasClient from "@/components/RecetasClient";
import RecipeCreateForm from "./RecipeCreateForm";
import { getFavorites } from "@/actions/favorites";

export default async function RecetasPage() {
  const supabase = await createClient();

  const [recipesResult, favs] = await Promise.all([
    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*, food:foods(*))")
      .order("name"),
    getFavorites(),
  ]);
  const favIds = favs.recipeIds;

  const recipes = (recipesResult.data as RecipeWithIngredients[] ?? []).sort((a, b) => {
    const aFav = favIds.has(a.id) ? 0 : 1;
    const bFav = favIds.has(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return (
    <div className="space-y-6">
      <h1 className="heading-display text-2xl">Recetas</h1>

      <RecipeCreateForm />

      <RecetasClient recipes={recipes} favIds={favIds} />
    </div>
  );
}
