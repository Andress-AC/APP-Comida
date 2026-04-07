"use client";

import { FoodWithUnits } from "@/lib/types";
import { addFoodUnit, deleteFoodUnit } from "@/actions/foods";
import { useState } from "react";

export default function FoodUnitsList({ food }: { food: FoodWithUnits }) {
  const [unitName, setUnitName] = useState("");
  const [unitGrams, setUnitGrams] = useState("");

  return (
    <div className="space-y-2">
      {food.food_units.map((unit) => (
        <div
          key={unit.id}
          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
        >
          <span>
            1 {unit.name} = {unit.grams}g
          </span>
          <button
            onClick={async () => {
              await deleteFoodUnit(unit.id, food.id);
            }}
            className="text-red-500 text-sm hover:underline"
          >
            Eliminar
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <input
          placeholder="Nombre (ej: bolsa)"
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Gramos"
          type="number"
          value={unitGrams}
          onChange={(e) => setUnitGrams(e.target.value)}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={async () => {
            if (unitName && unitGrams) {
              await addFoodUnit(food.id, unitName, Number(unitGrams));
              setUnitName("");
              setUnitGrams("");
            }
          }}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
