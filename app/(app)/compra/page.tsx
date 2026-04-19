import { createClient } from "@/lib/supabase/server";
import ShoppingListClient from "@/components/ShoppingListClient";
import Link from "next/link";

export default async function CompraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: items } = await supabase
    .from("shopping_items")
    .select("id, name, qty_text, is_checked")
    .eq("user_id", user!.id)
    .order("is_checked", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="heading-display text-2xl">Lista de la compra</h1>
        <Link
          href="/despensa"
          className="text-xs px-2.5 py-1 rounded-lg"
          style={{ color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
        >
          Despensa
        </Link>
      </div>

      <ShoppingListClient items={items ?? []} />
    </div>
  );
}
