"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateRecipeElaboration } from "@/actions/recipes";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function ElaborationEditor({
  recipeId,
  initial,
}: {
  recipeId: string;
  initial: string | null;
}) {
  const [text, setText] = useState(initial ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  useEffect(() => { resize(); }, []);

  const save = useCallback(async (value: string) => {
    setSaveState("saving");
    const result = await updateRecipeElaboration(recipeId, value);
    setSaveState(result.error ? "error" : "saved");
    setTimeout(() => setSaveState("idle"), 2000);
  }, [recipeId]);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setText(value);
    resize();
    setSaveState("idle");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value), 1200);
  }

  // Save on blur too (in case they navigate away quickly)
  function handleBlur() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (saveState === "idle" && text !== (initial ?? "")) save(text);
  }

  const statusColor =
    saveState === "saving" ? "var(--text-muted)"
    : saveState === "saved" ? "var(--sage)"
    : saveState === "error" ? "#f87171"
    : "transparent";

  const statusText =
    saveState === "saving" ? "Guardando..."
    : saveState === "saved" ? "Guardado ✓"
    : saveState === "error" ? "Error al guardar"
    : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/80">Elaboración</h2>
        <span className="text-xs transition-colors" style={{ color: statusColor }}>
          {statusText}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={"Escribe aquí los pasos de elaboración...\n\nEj:\n1. Precalentar el horno a 180°C\n2. Mezclar los ingredientes secos\n3. Hornear 25 min"}
        rows={4}
        className="w-full rounded-xl px-4 py-3 text-sm resize-none focus:outline-none transition-colors"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          lineHeight: "1.6",
          minHeight: "120px",
          fontFamily: "inherit",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--border-warm)")}
        onBlurCapture={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
      />
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Se guarda automáticamente mientras escribes
      </p>
    </div>
  );
}
