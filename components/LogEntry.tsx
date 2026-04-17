"use client";

"use client";

import { useRef, useState } from "react";
import { DailyLog, MEAL_CATEGORY_LABELS, MealCategory } from "@/lib/types";
import { calcLogMacros } from "@/lib/macros";
import { deleteLog, uploadLogPhoto, updateLogQuantity } from "@/actions/daily-logs";

export default function LogEntry({ log }: { log: DailyLog }) {
  const macros = calcLogMacros(log);
  const name = log.food?.name ?? log.recipe?.name ?? "Desconocido";
  const isFood = !!log.food;
  const mealLabel = MEAL_CATEGORY_LABELS[log.meal_type as MealCategory] ?? log.meal_type;

  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(log.image_url);
  const [showPhoto, setShowPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(
    isFood ? String(log.quantity_grams ?? "") : String(log.multiplier ?? 1)
  );
  const [editUnit, setEditUnit] = useState("grams");
  const [saving, setSaving] = useState(false);
  const foodUnits = isFood ? (log.food?.food_units ?? []) : [];

  // ── Swipe to delete ──────────────────────────────────────────────────────────
  const [swipeX, setSwipeX] = useState(0);          // current translation (0 = closed, negative = swiped left)
  const [swiped, setSwiped] = useState(false);       // locked open waiting for confirm tap
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null); // null until direction determined

  const THRESHOLD = 72; // px to trigger open state
  const DELETE_WIDTH = 80; // px of the revealed delete zone

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isHorizontal.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine direction on first significant movement
    if (isHorizontal.current === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      isHorizontal.current = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal.current) return; // vertical scroll — ignore

    e.preventDefault(); // prevent page scroll while swiping card
    const raw = swiped ? -DELETE_WIDTH + dx : dx;
    const clamped = Math.min(0, Math.max(-DELETE_WIDTH - 8, raw)); // only left swipe
    setSwipeX(clamped);
  }

  function onTouchEnd() {
    if (!isHorizontal.current) return;
    const openEnough = swipeX < -THRESHOLD;
    if (openEnough) {
      setSwipeX(-DELETE_WIDTH);
      setSwiped(true);
    } else {
      setSwipeX(0);
      setSwiped(false);
    }
  }

  function closeSwipe() {
    setSwipeX(0);
    setSwiped(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await deleteLog(log.id);
    setDeleting(false);
  }

  // ────────────────────────────────────────────────────────────────────────────

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const result = await uploadLogPhoto(log.id, fd);
    setUploading(false);
    if (result.success && result.url) setPhotoUrl(result.url);
  }

  function startEdit() {
    if (swiped) { closeSwipe(); return; }
    setEditing(true);
    setTimeout(() => { editRef.current?.focus(); editRef.current?.select(); }, 50);
  }

  async function commitEdit() {
    const num = parseFloat(editValue);
    if (isNaN(num) || num <= 0) { setEditing(false); return; }
    setSaving(true);
    let grams: number | null = null;
    if (isFood) {
      if (editUnit === "grams") {
        grams = num;
      } else {
        const u = foodUnits.find((u) => u.id === editUnit);
        grams = u ? u.grams * num : num;
      }
    }
    await updateLogQuantity(
      log.id,
      isFood ? grams : null,
      isFood ? null : num
    );
    setSaving(false);
    setEditing(false);
  }

  const detail = isFood
    ? `${log.quantity_grams}g`
    : `x${log.multiplier}`;

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ touchAction: "pan-y" }}>
      {/* Delete zone (behind the card) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center"
        style={{ width: DELETE_WIDTH, background: "rgba(239,68,68,0.15)", borderRadius: "0 16px 16px 0" }}
      >
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex flex-col items-center gap-0.5 px-4"
          aria-label="Eliminar"
        >
          {deleting ? (
            <span className="animate-pulse text-red-400 text-lg">●</span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-red-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="text-xs text-red-400 font-medium">Borrar</span>
            </>
          )}
        </button>
      </div>

      {/* Card content (slides left on swipe) */}
      <div
        className="glass-card overflow-hidden"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: isHorizontal.current ? "none" : "transform 0.25s ease",
          border: photoUrl ? "1px solid rgba(251,191,36,0.15)" : undefined,
          willChange: "transform",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={swiped ? closeSwipe : undefined}
      >
        {photoUrl && showPhoto && (
          <button className="w-full" onClick={() => setShowPhoto(false)} aria-label="Ocultar foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoUrl} alt={name} className="w-full max-h-48 object-cover" />
          </button>
        )}

        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            {photoUrl && !showPhoto && (
              <button onClick={() => setShowPhoto(true)} aria-label="Ver foto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl} alt={name}
                  className="h-9 w-9 rounded-lg object-cover flex-shrink-0"
                  style={{ border: "1px solid rgba(251,191,36,0.2)" }}
                />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-white/90 truncate">{name}</p>
                <span className="tag-muted shrink-0">{mealLabel}</span>
              </div>

              {/* Quantity — tap to edit */}
              {editing ? (
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <input
                    ref={editRef}
                    type="number"
                    min="0.1"
                    step={isFood ? "1" : "0.5"}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditing(false); }}
                    className="w-16 text-sm px-2 py-0.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-warm)", color: "var(--amber)" }}
                  />
                  {isFood && foodUnits.length > 0 ? (
                    <select
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="text-xs px-1.5 py-0.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid var(--border-warm)", color: "var(--text-muted)" }}
                    >
                      <option value="grams">g</option>
                      {foodUnits.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-white/40">{isFood ? "g" : "×"}</span>
                  )}
                  <button
                    onClick={commitEdit}
                    disabled={saving}
                    className="text-xs font-medium px-2 py-0.5 rounded-lg"
                    style={{ background: "rgba(34,197,94,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.25)" }}
                  >
                    {saving ? "..." : "✓"}
                  </button>
                  <button onClick={() => setEditing(false)} className="text-xs text-white/30 hover:text-white/50">✕</button>
                </div>
              ) : (
                <button onClick={startEdit} className="text-left group" title="Toca para editar cantidad">
                  <p className="text-sm text-white/40 group-hover:text-white/60 transition-colors">
                    <span className="underline decoration-dotted underline-offset-2">{detail}</span>
                    {" "}— {macros.kcal} kcal · {macros.protein}g prot
                  </p>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              aria-label="Añadir foto"
              className="transition-colors"
              style={{ color: uploading ? "rgba(255,255,255,0.2)" : photoUrl ? "var(--amber)" : "rgba(255,255,255,0.25)" }}
            >
              {uploading ? (
                <span className="text-xs animate-pulse">●</span>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
            {/* Desktop delete button — hidden when swiped open (use swipe zone instead) */}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400/60 hover:text-red-400 text-sm transition-colors md:flex hidden"
              aria-label="Eliminar"
            >
              {deleting ? <span className="animate-pulse">●</span> : "✕"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
