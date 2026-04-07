import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RecipeWithIngredients, MealCategory } from "@/lib/types";
import { calcRecipeMacros } from "@/lib/macros";
import { updateRecipeName, deleteRecipe } from "@/actions/recipes";
import RecipeIngredientEditor from "./RecipeIngredientEditor";
import RecipeCategorySelect from "@/components/RecipeCategorySelect";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recipe, error } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*, food:foods(*))")
    .eq("id", id)
    .single();

  if (error || !recipe) redirect("/recetas");

  const { data: foods } = await supabase
    .from("foods")
    .select("id, name, brand")
    .order("name");

  const macros = calcRecipeMacros(recipe as RecipeWithIngredients);

  return (
    <div className="space-y-6">
      <form
        action={async (formData: FormData) => {
          "use server";
          await updateRecipeName(id, formData.get("name") as string);
        }}
        className="flex gap-2"
      >
        <input
          name="name"
          required
          defaultValue={recipe.name}
          className="flex-1 text-2xl font-bold bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
        />
        <button
          type="submit"
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
        >
          Renombrar
        </button>
      </form>

      <RecipeCategorySelect
        recipeId={id}
        initial={(recipe.categories ?? ["comida", "cena"]) as MealCategory[]}
      />

      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-2">Macros totales</h2>
        <p className="text-lg font-bold">{macros.kcal} kcal</p>
        <p className="text-sm text-gray-600">
          {macros.protein}g prot · {macros.fat}g grasa · {macros.carbs}g carbs
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ingredientes</h2>
        <RecipeIngredientEditor
          recipeId={id}
          ingredients={recipe.recipe_ingredients}
          availableFoods={foods ?? []}
        />
      </section>

      <form
        action={async () => {
          "use server";
          await deleteRecipe(id);
          redirect("/recetas");
        }}
      >
        <button
          type="submit"
          className="w-full bg-red-600 text-white rounded-lg py-2 font-medium hover:bg-red-700"
        >
          Eliminar receta
        </button>
      </form>
    </div>
  );
}
