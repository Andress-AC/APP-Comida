"use client";

import { useState } from "react";

interface Analysis {
  resumen: string;
  fortalezas: string[];
  mejoras: string[];
  sugerencias: string[];
}

type State = "idle" | "loading" | "done" | "error";

export default function WeeklyAnalysis() {
  const [state, setState] = useState<State>("idle");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState("");

  async function generate() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/ai/weekly", { method: "POST" });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Error al generar análisis");
        setState("error");
        return;
      }
      setAnalysis(data);
      setState("done");
    } catch {
      setError("Error de conexión");
      setState("error");
    }
  }

  return (
    <div className="glass-card-static p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Análisis semanal IA
        </h3>
        {state !== "loading" && (
          <button
            onClick={generate}
            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-200"
            style={{
              background: "var(--amber-glow)",
              color: "var(--amber)",
              border: "1px solid var(--border-warm)",
            }}
          >
            {state === "done" ? "Regenerar" : "Generar"}
          </button>
        )}
      </div>

      {state === "idle" && (
        <p className="text-sm text-white/30">
          Pulsa "Generar" para obtener un análisis de tu semana con IA.
        </p>
      )}

      {state === "loading" && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 rounded bg-white/10 w-full" />
          <div className="h-3 rounded bg-white/10 w-4/5" />
          <div className="h-3 rounded bg-white/10 w-3/5" />
          <p className="text-xs text-white/30 pt-1">Analizando tu semana...</p>
        </div>
      )}

      {state === "error" && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {state === "done" && analysis && (
        <div className="space-y-4">
          {/* Resumen */}
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {analysis.resumen}
          </p>

          {/* Fortalezas */}
          {analysis.fortalezas?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                ✓ Puntos fuertes
              </p>
              <ul className="space-y-1">
                {analysis.fortalezas.map((item, i) => (
                  <li key={i} className="text-sm text-white/60 flex gap-2">
                    <span className="text-emerald-400/60 shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mejoras */}
          {analysis.mejoras?.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                ↑ Áreas de mejora
              </p>
              <ul className="space-y-1">
                {analysis.mejoras.map((item, i) => (
                  <li key={i} className="text-sm text-white/60 flex gap-2">
                    <span className="text-amber-400/60 shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Sugerencias */}
          {analysis.sugerencias?.length > 0 && (
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ background: "var(--amber-glow)", border: "1px solid var(--border-warm)" }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--amber)" }}>
                Sugerencias para esta semana
              </p>
              <ol className="space-y-1.5 list-none">
                {analysis.sugerencias.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: "var(--text-secondary)" }}>
                    <span className="font-bold shrink-0" style={{ color: "var(--amber)" }}>
                      {i + 1}.
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
