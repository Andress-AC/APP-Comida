import Link from "next/link";
import { RecipeWithIngredients, MealCategory, MEAL_CATEGORY_LABELS } from "@/lib/types";
import { calcRecipeMacros } from "@/lib/macros";

export default function RecipeCard({ recipe }: { recipe: RecipeWithIngredients }) {
  const macros = calcRecipeMacros(recipe);
  const cats = (recipe.categories ?? []) as MealCategory[];

  return (
    <Link
      href={`/recetas/${recipe.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <h3 className="font-medium">{recipe.name}</h3>
      {cats.length > 0 && (
        <div className="flex gap-1 mt-1">
          {cats.map((c) => (
            <span key={c} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
              {MEAL_CATEGORY_LABELS[c] ?? c}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-gray-500 mt-1">
        {macros.kcal} kcal · {macros.protein}g prot · {macros.fat}g grasa · {macros.carbs}g carbs
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {recipe.recipe_ingredients.length} ingrediente(s)
      </p>
    </Link>
  );
}
