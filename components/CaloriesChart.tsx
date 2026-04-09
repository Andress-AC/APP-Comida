"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DayData {
  date: string;
  label: string;
  kcal: number;
}

interface Props {
  data: DayData[];
  kcalTarget: number | null;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-xs px-3 py-2 rounded-lg"
      style={{ background: "rgba(6,15,30,0.95)", border: "1px solid var(--border-warm)" }}
    >
      <p className="text-white/50 mb-0.5">{label}</p>
      <p style={{ color: "var(--amber)" }}>{payload[0].value} kcal</p>
    </div>
  );
}

export default function CaloriesChart({ data, kcalTarget }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -20, bottom: 0 }} barSize={6} barGap={2}>
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
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        {kcalTarget && (
          <ReferenceLine
            y={kcalTarget}
            stroke="rgba(251,191,36,0.4)"
            strokeDasharray="4 3"
            label={{ value: `${kcalTarget}`, position: "right", fontSize: 9, fill: "rgba(251,191,36,0.5)" }}
          />
        )}
        <Bar dataKey="kcal" radius={[2, 2, 0, 0]}>
          {data.map((entry) => (
            <Cell
              key={entry.date}
              fill={
                kcalTarget && entry.kcal > kcalTarget
                  ? "rgba(248,113,113,0.7)"
                  : entry.kcal > 0
                  ? "var(--amber)"
                  : "rgba(255,255,255,0.08)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
