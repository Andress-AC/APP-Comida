"use client";

import { PantryItem } from "@/lib/types";
import { updatePantryQuantity, removeFromPantry } from "@/actions/pantry";
import { useState } from "react";

export default function PantryItemRow({ item }: { item: PantryItem }) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(item.quantity_grams.toString());

  return (
    <div className="flex items-center justify-between bg-white rounded-lg border px-4 py-3">
      <div className="flex-1">
        <p className="font-medium">{item.food?.name}</p>
        {editing ? (
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-24 rounded border px-2 py-1 text-sm"
            />
            <button
              onClick={async () => {
                await updatePantryQuantity(item.id, Number(qty));
                setEditing(false);
              }}
              className="text-blue-600 text-sm"
            >
              Guardar
            </button>
          </div>
        ) : (
          <p
            className={`text-sm cursor-pointer ${
              item.quantity_grams === 0
                ? "text-red-500 font-semibold"
                : "text-gray-500"
            }`}
            onClick={() => setEditing(true)}
          >
            {item.quantity_grams}g disponible
            {item.quantity_grams === 0 && " — ¡Agotado!"}
          </p>
        )}
      </div>
      <button
        onClick={() => removeFromPantry(item.id)}
        className="text-red-400 hover:text-red-600 text-sm ml-2"
      >
        ✕
      </button>
    </div>
  );
}
