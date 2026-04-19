"use client";

import { useState, useTransition, useRef } from "react";
import { addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearCheckedItems } from "@/actions/shopping";

interface Item {
  id: string;
  name: string;
  qty_text: string | null;
  is_checked: boolean;
}

export default function ShoppingListClient({ items }: { items: Item[] }) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [isPending, startTransition] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  const pending = items.filter((i) => !i.is_checked);
  const checked = items.filter((i) => i.is_checked);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await addShoppingItem(name.trim(), qty.trim() || undefined);
      setName("");
      setQty("");
      nameRef.current?.focus();
    });
  }

  function handleToggle(id: string, checked: boolean) {
    startTransition(() => toggleShoppingItem(id, checked));
  }

  function handleDelete(id: string) {
    startTransition(() => deleteShoppingItem(id));
  }

  function handleClear() {
    startTransition(() => clearCheckedItems());
  }

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={handleAdd} className="glass-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Añadir artículo
        </p>
        <div className="flex gap-2">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Producto..."
            className="flex-1 min-w-0 px-3 py-2 rounded-lg text-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Cantidad"
            className="w-24 px-3 py-2 rounded-lg text-sm"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            disabled={!name.trim() || isPending}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: name.trim() ? "var(--amber-glow)" : "rgba(255,255,255,0.04)",
              color: name.trim() ? "var(--amber)" : "var(--text-muted)",
              border: "1px solid var(--border-warm)",
            }}
          >
            +
          </button>
        </div>
      </form>

      {/* Pending items */}
      {pending.length > 0 && (
        <div className="glass-card-static rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Por comprar · {pending.length}
            </p>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {pending.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && (
        <div className="glass-card-static p-8 text-center">
          <p className="text-2xl mb-2">🛒</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>La lista está vacía</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Añade lo que necesitas comprar</p>
        </div>
      )}

      {/* Checked items */}
      {checked.length > 0 && (
        <div className="glass-card-static rounded-2xl overflow-hidden opacity-60">
          <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Comprado · {checked.length}
            </p>
            <button
              onClick={handleClear}
              disabled={isPending}
              className="text-xs px-2 py-0.5 rounded-lg transition-all"
              style={{ color: "var(--coral)", background: "var(--coral-soft)" }}
            >
              Limpiar
            </button>
          </div>
          <ul className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {checked.map((item) => (
              <ShoppingRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ShoppingRow({
  item,
  onToggle,
  onDelete,
}: {
  item: { id: string; name: string; qty_text: string | null; is_checked: boolean };
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={() => onToggle(item.id, !item.is_checked)}
        className="shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
        style={{
          borderColor: item.is_checked ? "var(--amber)" : "var(--border-warm)",
          background: item.is_checked ? "var(--amber-glow)" : "transparent",
        }}
      >
        {item.is_checked && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} style={{ color: "var(--amber)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className="text-sm"
          style={{
            color: item.is_checked ? "var(--text-muted)" : "var(--text-primary)",
            textDecoration: item.is_checked ? "line-through" : "none",
          }}
        >
          {item.name}
        </span>
        {item.qty_text && (
          <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {item.qty_text}
          </span>
        )}
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 p-1 rounded-lg transition-all"
        style={{ color: "var(--text-muted)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </li>
  );
}
