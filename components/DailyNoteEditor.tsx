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
    <div className="bg-white rounded-lg border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600"
      >
        <span>{initialContent ? "Nota del día" : "Añadir nota del día"}</span>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ej: Hoy comí menos porque estaba enfermo..."
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <button
            onClick={handleSave}
            disabled={saving || content === initialContent}
            className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar nota"}
          </button>
        </div>
      )}
    </div>
  );
}
