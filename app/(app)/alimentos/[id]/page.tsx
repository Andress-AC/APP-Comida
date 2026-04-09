import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FoodForm from "@/components/FoodForm";
import { updateFood, deleteFood, cloneAndEditFood } from "@/actions/foods";
import { FoodWithUnits } from "@/lib/types";
import FoodUnitsList from "./FoodUnitsList";
import DeleteFoodButton from "@/components/DeleteFoodButton";

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
  const isAdmin = profile?.is_admin ?? false;
  const canEditDirectly = isOwner || isAdmin;

  return (
    <div className="space-y-6">
      <h1 className="heading-display text-2xl">{food.name}</h1>

      {canEditDirectly ? (
        <>
          {isAdmin && !isOwner && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ color: 'var(--amber)', background: 'var(--amber-glow)', border: '1px solid var(--border-warm-strong)' }}>
              Editando alimento global — los cambios afectan a todos los usuarios
            </p>
          )}
          <FoodForm
            food={food}
            isAdmin={isAdmin}
            onSubmit={async (formData) => {
              "use server";
              const result = await updateFood(id, formData);
              if (!result?.error) redirect(`/alimentos#food-${id}`);
              return result;
            }}
            submitLabel="Guardar cambios"
          />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-white/80">Unidades</h2>
            <FoodUnitsList food={food as FoodWithUnits} />
          </section>

          <DeleteFoodButton
            foodId={id}
            label={isAdmin && !isOwner ? "Eliminar alimento global" : "Eliminar alimento"}
            isGlobalAdmin={isAdmin && !isOwner}
          />
        </>
      ) : (
        <>
          <p className="text-xs text-white/30">
            Alimento global — editar crea una copia personal solo para ti
          </p>

          <FoodForm
            food={food}
            isAdmin={false}
            onSubmit={async (formData) => {
              "use server";
              const result = await cloneAndEditFood(id, formData);
              if (!result.error) redirect(`/alimentos#food-${id}`);
              return result;
            }}
            submitLabel="Guardar mi versión"
          />

          <DeleteFoodButton foodId={id} label="Ocultar alimento" />
        </>
      )}
    </div>
  );
}
