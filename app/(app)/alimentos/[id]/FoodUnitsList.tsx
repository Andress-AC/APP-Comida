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
          className="flex items-center justify-between bg-white/[0.03] rounded-xl px-3 py-2"
        >
          <span className="text-white/70">
            1 {unit.name} = {unit.grams}g
          </span>
          <button
            onClick={async () => {
              await deleteFoodUnit(unit.id, food.id);
            }}
            className="text-red-400/60 text-sm hover:text-red-400 transition-colors"
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
          className="input-dark flex-1"
        />
        <input
          placeholder="Gramos"
          type="number"
          value={unitGrams}
          onChange={(e) => setUnitGrams(e.target.value)}
          className="input-dark w-24"
        />
        <button
          onClick={async () => {
            if (unitName && unitGrams) {
              await addFoodUnit(food.id, unitName, Number(unitGrams));
              setUnitName("");
              setUnitGrams("");
            }
          }}
          className="btn-primary"
        >
          Añadir
        </button>
      </div>
    </div>
  );
}
