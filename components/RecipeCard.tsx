import Link from "next/link";
import { RecipeWithIngredients, MealCategory, MEAL_CATEGORY_LABELS } from "@/lib/types";
import { calcRecipeMacros } from "@/lib/macros";
import FavoriteButton from "./FavoriteButton";

interface Props {
  recipe: RecipeWithIngredients;
  isFavorite?: boolean;
}

export default function RecipeCard({ recipe, isFavorite = false }: Props) {
  const macros = calcRecipeMacros(recipe);
  const cats = (recipe.categories ?? []) as MealCategory[];

  return (
    <Link
      href={`/recetas/${recipe.id}`}
      className="block glass-card p-4 hover:border-amber-500/40 transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white/90">{recipe.name}</h3>
          {cats.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {cats.map((c) => (
                <span key={c} className="tag-amber">
                  {MEAL_CATEGORY_LABELS[c] ?? c}
                </span>
              ))}
            </div>
          )}
          <p className="text-sm text-white/40 mt-1.5">
            {macros.kcal} kcal · {macros.protein}g prot · {macros.fat}g grasa · {macros.carbs}g carbs
          </p>
          <p className="text-xs text-white/25 mt-1">
            {recipe.recipe_ingredients.length} ingrediente(s)
          </p>
        </div>
        <FavoriteButton id={recipe.id} type="recipe" initialFavorite={isFavorite} />
      </div>
    </Link>
  );
}
