import { createClient } from "@/lib/supabase/server";
import { FoodWithUnits } from "@/lib/types";
import { fetchAllRows } from "@/lib/fetch-all-foods";
import FoodForm from "@/components/FoodForm";
import BarcodeScanner from "@/components/BarcodeScanner";
import LabelScanner from "@/components/LabelScanner";
import AlimentosClient from "@/components/AlimentosClient";
import { createFood } from "@/actions/foods";
import { getFavorites } from "@/actions/favorites";
import { getUserLists } from "@/actions/food-lists";
import { redirect } from "next/navigation";

export default async function AlimentosPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const [profileResult, favsResult, hiddenResult, lists] = await Promise.all([
    supabase.from("profiles").select("is_admin").eq("id", user!.id).single(),
    getFavorites(),
    supabase.from("user_hidden_foods").select("food_id").eq("user_id", user!.id),
    getUserLists(),
  ]);
  const profile = profileResult.data;
  const favIds = Array.from(favsResult.foodIds);
  const hiddenIds = new Set((hiddenResult.data ?? []).map((r: any) => r.food_id as string));

  const rawFoods = await fetchAllRows(
    supabase, "foods",
    "id, name, brand, kcal, protein, fat, carbs, sugar, fiber, salt, saturated_fat, image_url, category, subcategory, store, is_global, created_by, created_at"
  );
  // food_units not needed for list view — cast as FoodWithUnits with empty units
  const foods = rawFoods
    .filter((f: any) => !hiddenIds.has(f.id))
    .map((f: any) => ({ ...f, food_units: [] })) as FoodWithUnits[];

  return (
    <div className="space-y-6">
      <h1 className="heading-display text-2xl">Alimentos</h1>

      <details className="glass-card p-4">
        <summary className="font-medium text-white/70 cursor-pointer">📷 Escanear código de barras</summary>
        <div className="mt-4 border-t border-white/5 pt-4">
          <BarcodeScanner />
        </div>
      </details>

      <details className="glass-card p-4">
        <summary className="font-medium text-white/70 cursor-pointer">🤖 Leer etiqueta con IA</summary>
        <div className="mt-4 border-t border-white/5 pt-4">
          <LabelScanner />
        </div>
      </details>

      <details className="glass-card p-4">
        <summary className="font-medium text-white/70 cursor-pointer">+ Añadir alimento</summary>
        <div className="mt-4 border-t border-white/5 pt-4">
          <FoodForm
            isAdmin={profile?.is_admin}
            onSubmit={async (formData) => {
              "use server";
              const result = await createFood(formData);
              if (!result?.error) redirect("/alimentos");
              return result;
            }}
            submitLabel="Crear alimento"
          />
        </div>
      </details>

      <AlimentosClient foods={foods} favIds={favIds} isAdmin={profile?.is_admin ?? false} lists={lists} />
    </div>
  );
}
