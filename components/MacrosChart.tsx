"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DayData {
  date: string;
  label: string;
  protein: number;
  carbs: number;
  fat: number;
}

interface Props {
  data: DayData[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-xs px-3 py-2 rounded-lg space-y-0.5"
      style={{ background: "rgba(6,15,30,0.95)", border: "1px solid var(--border-warm)" }}
    >
      <p className="text-white/50 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value}g
        </p>
      ))}
    </div>
  );
}

export default function MacrosChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={180}>
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
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
          formatter={(value) => <span style={{ color: "rgba(255,255,255,0.5)" }}>{value}</span>}
        />
        <Line
          type="monotone"
          dataKey="protein"
          name="Proteína"
          stroke="#4ade80"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="carbs"
          name="Carbos"
          stroke="var(--amber)"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="fat"
          name="Grasas"
          stroke="#f87171"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
