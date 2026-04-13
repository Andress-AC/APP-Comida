import { createClient } from "@/lib/supabase/server";
import { PantryItem } from "@/lib/types";
import PantryItemRow from "@/components/PantryItemRow";
import DespensaAddForm from "@/components/DespensaAddForm";

export default async function DespensaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: pantryItems }, { data: foods }] = await Promise.all([
    supabase
      .from("pantry")
      .select("*, food:foods(*)")
      .eq("user_id", user!.id)
      .order("updated_at", { ascending: false }),
    supabase
      .from("foods")
      .select("id, name, brand, category, store")
      .order("name")
      .limit(5000),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="heading-display text-2xl">Despensa</h1>

      <DespensaAddForm foods={foods ?? []} />

      <div className="space-y-2">
        {(pantryItems as PantryItem[])?.map((item) => (
          <PantryItemRow key={item.id} item={item} />
        ))}
        {pantryItems?.length === 0 && (
          <p className="text-center py-8" style={{ color: "var(--text-muted)" }}>
            Despensa vacía
          </p>
        )}
      </div>
    </div>
  );
}
