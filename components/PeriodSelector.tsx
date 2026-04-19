"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { label: "7d", value: 7 },
  { label: "30d", value: 30 },
  { label: "90d", value: 90 },
];

export default function PeriodSelector({ current }: { current: number }) {
  const router = useRouter();
  const params = useSearchParams();

  function select(days: number) {
    const p = new URLSearchParams(params.toString());
    p.set("days", String(days));
    router.push(`/estadisticas?${p.toString()}`);
  }

  return (
    <div className="flex gap-1.5">
      {OPTIONS.map((o) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            onClick={() => select(o.value)}
            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-150"
            style={
              active
                ? { background: "var(--amber-glow)", color: "var(--amber)", border: "1px solid var(--border-warm-strong)" }
                : { background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
