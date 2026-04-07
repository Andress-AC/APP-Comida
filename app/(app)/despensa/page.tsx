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
      <h1 className="text-2xl font-bold">Despensa</h1>

      <form
        action={async (formData: FormData) => {
          "use server";
          const foodId = formData.get("food_id") as string;
          const grams = Number(formData.get("grams"));
          if (foodId && grams > 0) {
            await addToPantry(foodId, grams);
          }
        }}
        className="bg-white rounded-lg border p-4 space-y-3"
      >
        <h3 className="font-medium text-sm text-gray-600">Añadir a despensa</h3>
        <div className="flex gap-2">
          <select
            name="food_id"
            required
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
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
            className="w-28 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
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
          <p className="text-gray-500 text-center py-8">Despensa vacía</p>
        )}
      </div>
    </div>
  );
}
