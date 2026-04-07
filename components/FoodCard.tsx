import Link from "next/link";
import { FoodWithUnits } from "@/lib/types";

export default function FoodCard({ food }: { food: FoodWithUnits }) {
  return (
    <Link
      href={`/alimentos/${food.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        {food.image_url ? (
          <img
            src={food.image_url}
            alt={food.name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xl">
            🍽
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{food.name}</h3>
          <p className="text-xs text-gray-400">{food.brand}</p>
          <p className="text-sm text-gray-500">
            {food.kcal} kcal · {food.protein}g prot · {food.fat}g grasa · {food.carbs}g carbs
          </p>
        </div>
      </div>
    </Link>
  );
}
