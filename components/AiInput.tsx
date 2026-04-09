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
    <div className="glass-warm p-5 space-y-3 animate-in animate-in-delay-2">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--amber)' }}>
        Registrar con IA
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Ej: "200g pechuga empanada, 1 bolsa arroz"'
          onKeyDown={(e) => e.key === "Enter" && handleParse()}
          className="input-dark flex-1"
        />
        <button
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="btn-primary"
        >
          {loading ? "..." : "Parsear"}
        </button>
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--coral)' }}>{error}</p>}

      {parsed && (
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            He interpretado esto:
          </p>
          {parsed.map((item, i) => (
            <div
              key={i}
              className="text-sm px-3 py-2 rounded-lg"
              style={{
                background: item.food_id || item.recipe_id ? 'var(--sage-soft)' : 'var(--coral-soft)',
                border: `1px solid ${item.food_id || item.recipe_id ? 'rgba(107,143,113,0.2)' : 'rgba(224,122,95,0.2)'}`,
              }}
            >
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {item.recipe_id ? ` — x${item.multiplier}` : ` — ${item.quantity_grams}g`}
              </span>
              {!item.food_id && !item.recipe_id && (
                <span className="ml-2" style={{ color: 'var(--coral)' }}>(no encontrado)</span>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={handleConfirm} disabled={loading} className="btn-sage flex-1">
              Confirmar y registrar
            </button>
            <button onClick={() => setParsed(null)} className="btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
