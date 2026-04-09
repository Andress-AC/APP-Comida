"use client";

import { PantryItem } from "@/lib/types";
import { updatePantryQuantity, removeFromPantry } from "@/actions/pantry";
import { useState } from "react";

export default function PantryItemRow({ item }: { item: PantryItem }) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(item.quantity_grams.toString());

  return (
    <div className="flex items-center justify-between glass-card px-4 py-3">
      <div className="flex-1">
        <p className="font-medium text-white/90">{item.food?.name}</p>
        {editing ? (
          <div className="flex gap-2 mt-1">
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="input-dark w-24 !py-1 !px-2"
            />
            <button
              onClick={async () => {
                await updatePantryQuantity(item.id, Number(qty));
                setEditing(false);
              }}
              className="text-amber-500 text-sm hover:text-amber-400 transition-colors"
            >
              Guardar
            </button>
          </div>
        ) : (
          <p
            className={`text-sm cursor-pointer ${
              item.quantity_grams === 0
                ? "text-red-400 font-semibold"
                : "text-white/40"
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
        className="text-red-400/60 hover:text-red-400 text-sm ml-2 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
