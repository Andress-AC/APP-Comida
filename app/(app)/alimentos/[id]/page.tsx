import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FoodForm from "@/components/FoodForm";
import { updateFood, deleteFood } from "@/actions/foods";
import { FoodWithUnits } from "@/lib/types";
import FoodUnitsList from "./FoodUnitsList";

export default async function FoodDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: food, error } = await supabase
    .from("foods")
    .select("*, food_units(*)")
    .eq("id", id)
    .single();

  if (error || !food) redirect("/alimentos");

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user!.id)
    .single();

  const isOwner = food.created_by === user!.id;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{food.name}</h1>

      {isOwner ? (
        <>
          <FoodForm
            food={food}
            isAdmin={profile?.is_admin}
            onSubmit={async (formData) => {
              "use server";
              return updateFood(id, formData);
            }}
            submitLabel="Guardar cambios"
          />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Unidades</h2>
            <FoodUnitsList food={food as FoodWithUnits} />
          </section>

          <form
            action={async () => {
              "use server";
              await deleteFood(id);
              redirect("/alimentos");
            }}
          >
            <button
              type="submit"
              className="w-full bg-red-600 text-white rounded-lg py-2 font-medium hover:bg-red-700"
            >
              Eliminar alimento
            </button>
          </form>
        </>
      ) : (
        <div className="bg-white rounded-lg border p-4 space-y-2">
          <p className="text-sm text-gray-500">
            Alimento global — no editable
          </p>
          <p><strong>Calorias:</strong> {food.kcal} kcal/100g</p>
          <p><strong>Proteinas:</strong> {food.protein}g</p>
          <p><strong>Grasas:</strong> {food.fat}g ({food.saturated_fat}g sat.)</p>
          <p><strong>Carbos:</strong> {food.carbs}g ({food.sugar}g azuc.)</p>
          <p><strong>Fibra:</strong> {food.fiber}g</p>
          <p><strong>Sal:</strong> {food.salt}g</p>
        </div>
      )}
    </div>
  );
}
