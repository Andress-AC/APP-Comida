"use client";

import { useState } from "react";
import { DayTemplate } from "@/lib/types";
import { saveAsTemplate, applyTemplate, deleteTemplate } from "@/actions/templates";

interface Props {
  templates: DayTemplate[];
  hasLogsToday: boolean;
}

export default function TemplateSection({ templates: initialTemplates, hasLogsToday }: Props) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  function flash(text: string, ok: boolean) {
    setMessage({ text, ok });
    setTimeout(() => setMessage(null), 2500);
  }

  async function handleSave() {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    const result = await saveAsTemplate(name);
    setSaving(false);
    if (result.error) {
      flash(result.error, false);
    } else {
      setNewName("");
      setShowInput(false);
      flash("Plantilla guardada", true);
    }
  }

  async function handleApply(templateId: string) {
    setApplyingId(templateId);
    const result = await applyTemplate(templateId);
    setApplyingId(null);
    if (result.error) {
      flash(result.error, false);
    } else {
      flash(`${result.count} registros aplicados`, true);
    }
  }

  async function handleDelete(templateId: string) {
    setDeletingId(templateId);
    const result = await deleteTemplate(templateId);
    setDeletingId(null);
    if (result.error) {
      flash(result.error, false);
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    }
  }

  return (
    <div className="glass-card-static p-5 space-y-3 animate-in animate-in-delay-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
          Plantillas
        </h3>
        {hasLogsToday && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-200"
            style={{
              background: "var(--amber-glow)",
              color: "var(--amber)",
              border: "1px solid var(--border-warm)",
            }}
          >
            Guardar día actual
          </button>
        )}
      </div>

      {showInput && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            placeholder="Nombre de la plantilla..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setShowInput(false); }}
            className="input-dark flex-1 text-sm"
          />
          <button
            onClick={handleSave}
            disabled={!newName.trim() || saving}
            className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
            style={{
              background: "var(--amber-glow)",
              color: "var(--amber)",
              border: "1px solid var(--border-warm)",
              opacity: !newName.trim() || saving ? 0.5 : 1,
            }}
          >
            {saving ? "..." : "Guardar"}
          </button>
          <button
            onClick={() => { setShowInput(false); setNewName(""); }}
            className="text-xs px-2 py-1.5 rounded-lg font-medium text-white/40 hover:text-white/60 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {message && (
        <p className={`text-xs font-medium ${message.ok ? "text-emerald-400" : "text-red-400"}`}>
          {message.text}
        </p>
      )}

      {templates.length === 0 && !showInput && (
        <p className="text-sm text-white/30">
          {hasLogsToday
            ? "Guarda el día actual como plantilla para reutilizarlo."
            : "Sin plantillas aún. Registra algo hoy y guárdalo."}
        </p>
      )}

      {templates.length > 0 && (
        <ul className="space-y-2">
          {templates.map((tpl) => (
            <li
              key={tpl.id}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}
            >
              <div>
                <p className="text-sm font-medium text-white/80">{tpl.name}</p>
                <p className="text-xs text-white/30">
                  {tpl.day_template_items?.length ?? 0} elemento{(tpl.day_template_items?.length ?? 0) !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleApply(tpl.id)}
                  disabled={applyingId === tpl.id}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-200"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    color: "#4ade80",
                    border: "1px solid rgba(74,222,128,0.25)",
                    opacity: applyingId === tpl.id ? 0.5 : 1,
                  }}
                >
                  {applyingId === tpl.id ? "..." : "Aplicar"}
                </button>
                <button
                  onClick={() => handleDelete(tpl.id)}
                  disabled={deletingId === tpl.id}
                  className="text-xs px-2 py-1 rounded-lg font-medium transition-all duration-200 text-white/30 hover:text-red-400"
                  style={{ opacity: deletingId === tpl.id ? 0.5 : 1 }}
                >
                  {deletingId === tpl.id ? "..." : "✕"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
