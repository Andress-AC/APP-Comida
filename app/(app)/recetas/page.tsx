import { createClient } from "@/lib/supabase/server";
import { RecipeWithIngredients, MealCategory, MEAL_CATEGORIES } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";
import { createRecipe } from "@/actions/recipes";
import { redirect } from "next/navigation";
import RecipeCreateForm from "./RecipeCreateForm";

export default async function RecetasPage() {
  const supabase = await createClient();

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*, food:foods(*))")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recetas</h1>

      <RecipeCreateForm />

      <div className="space-y-2">
        {(recipes as RecipeWithIngredients[])?.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
        {recipes?.length === 0 && (
          <p className="text-gray-500 text-center py-8">No hay recetas</p>
        )}
      </div>
    </div>
  );
}
