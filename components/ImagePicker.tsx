"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Props {
  existingUrl?: string | null;
}

const MAX_PX = 1200;     // max width or height
const JPEG_QUALITY = 0.82;

/** Resize + compress image to a JPEG data URL, max MAX_PX on longest side */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          if (width >= height) {
            height = Math.round((height * MAX_PX) / width);
            width = MAX_PX;
          } else {
            width = Math.round((width * MAX_PX) / height);
            height = MAX_PX;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(src); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}

export default function ImagePicker({ existingUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const loadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPreview(compressed);
      setDataUrl(compressed);
    } catch {
      // fallback: use original as-is
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setPreview(url);
        setDataUrl(url);
      };
      reader.readAsDataURL(file);
    } finally {
      setCompressing(false);
    }
  }, []);

  // Global paste listener — works regardless of which element has focus
  useEffect(() => {
    function onWindowPaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/")
      );
      if (item) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) loadFile(file);
      }
    }
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [loadFile]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) =>
      i.type.startsWith("image/")
    );
    if (item) {
      e.preventDefault();
      const file = item.getAsFile();
      if (file) loadFile(file);
    }
  }, [loadFile]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function clearImage() {
    setPreview(null);
    setDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
        Imagen (opcional)
      </label>

      {/* Drop / paste zone */}
      <div
        ref={dropRef}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        tabIndex={0}
        className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors focus:outline-none"
        style={{
          borderColor: "var(--border-warm)",
          background: "var(--bg-card)",
          minHeight: preview ? "auto" : "80px",
          padding: preview ? "0" : "16px",
        }}
        onClick={() => !preview && fileInputRef.current?.click()}
      >
        {compressing ? (
          <div className="py-6 flex flex-col items-center gap-2">
            <span className="animate-pulse text-2xl">🖼️</span>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Procesando imagen...</p>
          </div>
        ) : preview ? (
          <div className="relative w-full">
            <img
              src={preview}
              alt="Vista previa"
              className="w-full rounded-xl object-cover max-h-48"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearImage(); }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "rgba(0,0,0,0.6)", color: "white" }}
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--text-muted)" }}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
              Pulsa, pega (Ctrl+V) o arrastra una imagen
            </p>
          </>
        )}
      </div>

      {/* Botones: archivo + cámara */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={compressing}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          📁 Elegir archivo
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={compressing}
          className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
          style={{ background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          📷 Cámara
        </button>
      </div>

      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hidden field con data URL para el submit */}
      {dataUrl && (
        <input type="hidden" name="image_data_url" value={dataUrl} />
      )}
      {/* Si no hay data URL nueva pero hay URL existente, preservarla */}
      {!dataUrl && existingUrl && preview && (
        <input type="hidden" name="image_existing_url" value={existingUrl} />
      )}
    </div>
  );
}
