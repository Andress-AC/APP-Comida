"use client";

import { useState } from "react";
import { copyLogsFromDay } from "@/actions/daily-logs";

interface Props {
  date: string;
}

export default function CopyDayButton({ date }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (state === "loading") return;
    setState("loading");
    const result = await copyLogsFromDay(date);
    if (result.error) {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    } else {
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  const label =
    state === "loading" ? "..." :
    state === "done" ? "✓ Copiado" :
    state === "error" ? "Error" :
    "Copiar a hoy";

  return (
    <button
      onClick={handleCopy}
      title="Copiar todos los registros de este día a hoy"
      className="text-xs px-2.5 py-1 rounded-lg transition-all duration-200 font-medium"
      style={{
        background: state === "done"
          ? "rgba(34, 197, 94, 0.15)"
          : state === "error"
          ? "rgba(239, 68, 68, 0.15)"
          : "var(--amber-glow)",
        color: state === "done"
          ? "#4ade80"
          : state === "error"
          ? "#f87171"
          : "var(--amber)",
        border: `1px solid ${state === "done" ? "rgba(74,222,128,0.3)" : state === "error" ? "rgba(248,113,113,0.3)" : "var(--border-warm)"}`,
        opacity: state === "loading" ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}
