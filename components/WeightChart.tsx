"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { logWeight } from "@/actions/stats";

interface WeightEntry {
  date: string;
  label: string;
  weight_kg: number;
}

interface Props {
  data: WeightEntry[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-xs px-3 py-2 rounded-lg"
      style={{ background: "rgba(6,15,30,0.95)", border: "1px solid var(--border-warm)" }}
    >
      <p className="text-white/50 mb-0.5">{label}</p>
      <p style={{ color: "#60a5fa" }}>{payload[0].value} kg</p>
    </div>
  );
}

export default function WeightChart({ data }: Props) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const avg = data.length
    ? Math.round((data.reduce((s, d) => s + d.weight_kg, 0) / data.length) * 10) / 10
    : null;

  async function handleLog() {
    const kg = parseFloat(input);
    if (!kg || kg < 20 || kg > 300) return;
    setSaving(true);
    const result = await logWeight(kg);
    setSaving(false);
    if (result.error) {
      setMessage({ text: result.error, ok: false });
    } else {
      setMessage({ text: "Peso registrado", ok: true });
      setInput("");
    }
    setTimeout(() => setMessage(null), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="0.1"
          min="20"
          max="300"
          placeholder="Tu peso hoy (kg)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleLog(); }}
          className="input-dark flex-1 text-sm"
        />
        <button
          onClick={handleLog}
          disabled={!input || saving}
          className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
          style={{
            background: "rgba(96,165,250,0.12)",
            color: "#60a5fa",
            border: "1px solid rgba(96,165,250,0.25)",
            opacity: !input || saving ? 0.5 : 1,
          }}
        >
          {saving ? "..." : "Registrar"}
        </button>
      </div>

      {message && (
        <p className={`text-xs ${message.ok ? "text-emerald-400" : "text-red-400"}`}>{message.text}</p>
      )}

      {data.length === 0 ? (
        <p className="text-sm text-white/30 text-center py-4">
          Registra tu peso diariamente para ver la tendencia
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
              tickLine={false}
              axisLine={false}
              width={36}
              domain={["dataMin - 1", "dataMax + 1"]}
            />
            <Tooltip content={<CustomTooltip />} />
            {avg && (
              <ReferenceLine
                y={avg}
                stroke="rgba(96,165,250,0.3)"
                strokeDasharray="4 3"
                label={{ value: `${avg}kg`, position: "right", fontSize: 9, fill: "rgba(96,165,250,0.5)" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="weight_kg"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: "#60a5fa", r: 3 }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
