"use client";

import { useState } from "react";
import { upsertNote } from "@/actions/notes";

interface Props {
  date: string;
  initialContent: string;
}

export default function DailyNoteEditor({ date, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(!!initialContent);

  async function handleSave() {
    setSaving(true);
    await upsertNote(date, content);
    setSaving(false);
  }

  return (
    <div className="glass-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-white/60 hover:text-white/80 transition-colors"
      >
        <span>{initialContent ? "Nota del día" : "Añadir nota del día"}</span>
        <span className="text-white/30">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-white/5 pt-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ej: Hoy comí menos porque estaba enfermo..."
            rows={2}
            className="input-dark w-full resize-none"
          />
          <button
            onClick={handleSave}
            disabled={saving || content === initialContent}
            className="btn-primary"
          >
            {saving ? "Guardando..." : "Guardar nota"}
          </button>
        </div>
      )}
    </div>
  );
}
