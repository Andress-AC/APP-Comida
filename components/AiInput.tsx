"use client";

import { useState } from "react";
import { logFood, logRecipe } from "@/actions/daily-logs";

interface ParsedItem {
  food_id: string | null;
  recipe_id: string | null;
  name: string;
  quantity_grams: number;
  multiplier: number;
}

export default function AiInput() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedItem[] | null>(null);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!text.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setParsed(data.items);
      }
    } catch {
      setError("Error al conectar con la IA");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!parsed) return;
    setLoading(true);

    for (const item of parsed) {
      if (item.recipe_id) {
        await logRecipe(item.recipe_id, item.multiplier);
      } else if (item.food_id) {
        await logFood(item.food_id, item.quantity_grams);
      }
    }

    setText("");
    setParsed(null);
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-3">
      <h3 className="font-medium text-sm text-gray-600">
        Registrar con IA
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Ej: "200g pechuga empanada, 1 bolsa arroz"'
          onKeyDown={(e) => e.key === "Enter" && handleParse()}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? "..." : "Parsear"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {parsed && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            He interpretado esto:
          </p>
          {parsed.map((item, i) => (
            <div
              key={i}
              className={`text-sm px-3 py-2 rounded ${
                item.food_id || item.recipe_id
                  ? "bg-green-50 border border-green-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              <span className="font-medium">{item.name}</span>
              {item.recipe_id
                ? ` — x${item.multiplier}`
                : ` — ${item.quantity_grams}g`}
              {!item.food_id && !item.recipe_id && (
                <span className="text-yellow-600 ml-2">
                  (no encontrado en la BD)
                </span>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              Confirmar y registrar
            </button>
            <button
              onClick={() => setParsed(null)}
              className="px-4 py-2 rounded-lg text-sm border hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
