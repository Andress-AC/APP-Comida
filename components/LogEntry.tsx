"use client";

import { DailyLog, MEAL_CATEGORY_LABELS, MealCategory } from "@/lib/types";
import { calcLogMacros } from "@/lib/macros";
import { deleteLog } from "@/actions/daily-logs";

export default function LogEntry({ log }: { log: DailyLog }) {
  const macros = calcLogMacros(log);
  const name = log.food?.name ?? log.recipe?.name ?? "Desconocido";
  const detail = log.food
    ? `${log.quantity_grams}g`
    : `x${log.multiplier}`;
  const mealLabel = MEAL_CATEGORY_LABELS[log.meal_type as MealCategory] ?? log.meal_type;

  return (
    <div className="flex items-center justify-between bg-white rounded-lg border px-4 py-3">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium">{name}</p>
          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{mealLabel}</span>
        </div>
        <p className="text-sm text-gray-500">
          {detail} — {macros.kcal} kcal · {macros.protein}g prot
        </p>
      </div>
      <button
        onClick={() => deleteLog(log.id)}
        className="text-red-400 hover:text-red-600 text-sm"
      >
        ✕
      </button>
    </div>
  );
}
