import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/restaurant";
import { addHours, deleteHours, updateSettings } from "./actions";
import { HoursForm } from "./hours-form";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export default function SchedulePage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Horarios de recogida</h1>
      <Suspense fallback={<p className="text-gray-500">Cargando horarios...</p>}>
        <ScheduleContent />
      </Suspense>
    </section>
  );
}

async function ScheduleContent() {
  const restaurant = await requireRestaurant();
  const hours = await db.pickupHours.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ dayOfWeek: "asc" }, { opensAt: "asc" }],
  });

  return (
    <div className="space-y-8">
      <form action={updateSettings} className="space-y-4 rounded-lg border p-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="acceptingOrders" defaultChecked={restaurant.acceptingOrders} />
          <span className="font-medium">Aceptar pedidos para recoger</span>
        </label>
        <label className="block text-sm">
          Antelación mínima (minutos entre el pedido y la recogida)
          <input
            name="minPrepMinutes"
            type="number"
            min={0}
            max={1440}
            defaultValue={restaurant.minPrepMinutes}
            className="mt-1 block w-32 rounded-md border px-3 py-2"
          />
        </label>
        <button className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Guardar ajustes
        </button>
      </form>

      {hours.length === 0 && (
        <p className="text-[#F0F9FF]">
          Todavía no has definido horarios. Mientras no haya ningún tramo, tus clientes
          no podrán elegir hora de recogida.
        </p>
      )}

      {DAYS.map((day) => {
        const ranges = hours.filter((h) => h.dayOfWeek === day.value);
        return (
          <div key={day.value} className="rounded-lg border p-4">
            <h2 className="mb-3 text-lg font-semibold">{day.label}</h2>

            {ranges.length === 0 ? (
              <p className="mb-3 text-sm text-black-500">Cerrado</p>
            ) : (
              <ul className="mb-3 divide-y">
                {ranges.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <strong>{h.opensAt} – {h.closesAt}</strong>
                      <span className="ml-2 text-sm text-black-600">
                        franjas de {h.slotMinutes} min · máx. {h.maxOrdersPerSlot} pedidos
                      </span>
                    </span>
                    <form action={deleteHours.bind(null, h.id)}>
                      <button className="rounded border px-2 py-1 text-sm text-red-600">Quitar</button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <details className="rounded-md bg-gray-50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-[black]">+ Añadir tramo</summary>
              <div className="mt-3">
                <HoursForm action={addHours.bind(null, day.value)} />
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}