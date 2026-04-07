import { createClient } from "@/lib/supabase/server";
import { FoodWithUnits } from "@/lib/types";
import FoodCard from "@/components/FoodCard";
import FoodForm from "@/components/FoodForm";
import SearchInput from "@/components/SearchInput";
import { createFood } from "@/actions/foods";

export default async function AlimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user!.id)
    .single();

  let query = supabase
    .from("foods")
    .select("*, food_units(*)")
    .order("name");

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: foods } = await query;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Alimentos</h1>

      <SearchInput basePath="/alimentos" />

      <details className="bg-white rounded-lg border border-gray-200 p-4">
        <summary className="font-medium cursor-pointer">+ Añadir alimento</summary>
        <div className="mt-4">
          <FoodForm
            isAdmin={profile?.is_admin}
            onSubmit={createFood}
            submitLabel="Crear alimento"
          />
        </div>
      </details>

      <div className="space-y-2">
        {(foods as FoodWithUnits[])?.map((food) => (
          <FoodCard key={food.id} food={food} />
        ))}
        {foods?.length === 0 && (
          <p className="text-gray-500 text-center py-8">No hay alimentos</p>
        )}
      </div>
    </div>
  );
}
