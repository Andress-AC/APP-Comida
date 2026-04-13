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
    .select("id, name, brand, category, store")
    .order("name")
    .limit(5000);

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
          className="flex-1 text-2xl font-bold bg-transparent border-b border-white/10 text-white/90 focus:outline-none focus:border-amber-500 heading-display"
        />
        <button
          type="submit"
          className="btn-primary !py-1"
        >
          Renombrar
        </button>
      </form>

      <RecipeCategorySelect
        recipeId={id}
        initial={(recipe.categories ?? ["comida", "cena"]) as MealCategory[]}
      />

      <div className="glass-card p-4 space-y-2">
        <h2 className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Macros totales</h2>
        <p className="text-xl font-bold" style={{ color: "var(--amber)" }}>{macros.kcal} kcal</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>Proteínas <strong style={{ color: "var(--text-primary)" }}>{macros.protein}g</strong></span>
          <span style={{ color: "var(--text-secondary)" }}>Grasas <strong style={{ color: "var(--text-primary)" }}>{macros.fat}g</strong></span>
          <span style={{ color: "var(--text-secondary)" }}>Grasas sat. <strong style={{ color: "var(--text-primary)" }}>{macros.saturated_fat}g</strong></span>
          <span style={{ color: "var(--text-secondary)" }}>Carbohidratos <strong style={{ color: "var(--text-primary)" }}>{macros.carbs}g</strong></span>
          <span style={{ color: "var(--text-secondary)" }}>Azúcares <strong style={{ color: "var(--text-primary)" }}>{macros.sugar}g</strong></span>
          <span style={{ color: "var(--text-secondary)" }}>Fibra <strong style={{ color: "var(--text-primary)" }}>{macros.fiber}g</strong></span>
          <span style={{ color: "var(--text-secondary)" }}>Sal <strong style={{ color: "var(--text-primary)" }}>{macros.salt}g</strong></span>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white/80">Ingredientes</h2>
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
          className="btn-danger w-full"
        >
          Eliminar receta
        </button>
      </form>
    </div>
  );
}
