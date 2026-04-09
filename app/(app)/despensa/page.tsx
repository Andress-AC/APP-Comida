import { createClient } from "@/lib/supabase/server";
import { PantryItem } from "@/lib/types";
import PantryItemRow from "@/components/PantryItemRow";
import { addToPantry } from "@/actions/pantry";

export default async function DespensaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: pantryItems } = await supabase
    .from("pantry")
    .select("*, food:foods(*)")
    .eq("user_id", user!.id)
    .order("updated_at", { ascending: false });

  const { data: foods } = await supabase
    .from("foods")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="heading-display text-2xl">Despensa</h1>

      <form
        action={async (formData: FormData) => {
          "use server";
          const foodId = formData.get("food_id") as string;
          const grams = Number(formData.get("grams"));
          if (foodId && grams > 0) {
            await addToPantry(foodId, grams);
          }
        }}
        className="glass-card p-4 space-y-3"
      >
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">Añadir a despensa</h3>
        <div className="flex gap-2">
          <select
            name="food_id"
            required
            className="input-dark flex-1"
          >
            <option value="">Seleccionar alimento...</option>
            {(foods ?? []).map((f: any) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <input
            name="grams"
            type="number"
            required
            min="1"
            placeholder="Gramos"
            className="input-dark w-28"
          />
          <button
            type="submit"
            className="btn-primary"
          >
            Añadir
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {(pantryItems as PantryItem[])?.map((item) => (
          <PantryItemRow key={item.id} item={item} />
        ))}
        {pantryItems?.length === 0 && (
          <p className="text-white/30 text-center py-8">Despensa vacía</p>
        )}
      </div>
    </div>
  );
}
