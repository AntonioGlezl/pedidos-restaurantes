import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/restaurant";
import { centsToInput, formatPrice } from "@/lib/format";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  moveCategory,
  moveItem,
  renameCategory,
  toggleItemAvailability,
  updateItem,
} from "./actions";
import { ConfirmButton } from "./confirm-button";
import { ItemForm } from "./item-form";

export default function MenuPage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Carta</h1>
      <Suspense fallback={<p className="text-gray-500">Cargando carta...</p>}>
        <MenuContent />
      </Suspense>
    </section>
  );
}

const small = "rounded border px-2 py-1 text-sm disabled:opacity-30";

async function MenuContent() {
  const restaurant = await requireRestaurant();

  const categories = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    include: { items: { orderBy: [{ position: "asc" }, { id: "asc" }] } },
  });

  return (
    <div className="space-y-8">
      <form action={createCategory} className="flex gap-2">
        <input
          name="name"
          placeholder="Nueva categoría (ej. Entrantes)"
          maxLength={40}
          required
          className="w-full rounded-md border px-3 py-2"
        />
        <button className="whitespace-nowrap rounded-md bg-black px-4 py-2 text-sm font-medium text-white">
          Añadir categoría
        </button>
      </form>

      {categories.length === 0 && (
        <p className="text-gray-600">
          Aún no tienes categorías. Crea la primera (Entrantes, Pizzas, Postres...) y
          añade platos dentro.
        </p>
      )}

      {categories.map((category, ci) => (
        <div key={category.id} className="rounded-lg border p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <div className="flex items-center gap-1">
              <form action={moveCategory.bind(null, category.id, "up")}>
                <button className={small} disabled={ci === 0} aria-label="Subir categoría">↑</button>
              </form>
              <form action={moveCategory.bind(null, category.id, "down")}>
                <button className={small} disabled={ci === categories.length - 1} aria-label="Bajar categoría">↓</button>
              </form>
              <form action={deleteCategory.bind(null, category.id)}>
                <ConfirmButton
                  message={`¿Borrar "${category.name}" y todos sus platos?`}
                  className={`${small} text-red-600`}
                >
                  Borrar
                </ConfirmButton>
              </form>
            </div>
          </div>

          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-gray-600">Renombrar categoría</summary>
            <form action={renameCategory.bind(null, category.id)} className="mt-2 flex gap-2">
              <input
                name="name"
                defaultValue={category.name}
                maxLength={40}
                required
                className="w-full rounded-md border px-3 py-2"
              />
              <button className="rounded-md border px-3 py-2 text-sm">Guardar</button>
            </form>
          </details>

          <ul className="divide-y">
            {category.items.length === 0 && (
              <li className="py-3 text-sm text-gray-500">Esta categoría no tiene platos todavía.</li>
            )}

            {category.items.map((item, ii) => (
              <li key={item.id} className="py-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className={item.available ? "" : "opacity-50"}>
                    <p className="font-medium">
                      {item.name}{" "}
                      {!item.available && (
                        <span className="ml-1 rounded bg-gray-200 px-2 py-0.5 text-xs">Agotado</span>
                      )}
                    </p>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                  </div>
                  <p className="font-medium">{formatPrice(item.priceCents)}</p>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1">
                  <form action={moveItem.bind(null, item.id, "up")}>
                    <button className={small} disabled={ii === 0} aria-label="Subir plato">↑</button>
                  </form>
                  <form action={moveItem.bind(null, item.id, "down")}>
                    <button className={small} disabled={ii === category.items.length - 1} aria-label="Bajar plato">↓</button>
                  </form>
                  <form action={toggleItemAvailability.bind(null, item.id)}>
                    <button className={small}>
                      {item.available ? "Marcar agotado" : "Marcar disponible"}
                    </button>
                  </form>
                  <form action={deleteItem.bind(null, item.id)}>
                    <ConfirmButton
                      message={`¿Borrar "${item.name}"?`}
                      className={`${small} text-red-600`}
                    >
                      Borrar
                    </ConfirmButton>
                  </form>
                </div>

                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-600">Editar plato</summary>
                  <div className="mt-2">
                    <ItemForm
                      action={updateItem.bind(null, item.id)}
                      initial={{
                        name: item.name,
                        description: item.description ?? "",
                        price: centsToInput(item.priceCents),
                      }}
                      submitLabel="Guardar cambios"
                      successLabel="Cambios guardados"
                    />
                  </div>
                </details>
              </li>
            ))}
          </ul>

          <details className="mt-4 rounded-md bg-gray-50 p-3">
            <summary className="cursor-pointer text-sm font-medium">+ Añadir plato</summary>
            <div className="mt-3">
              <ItemForm
                action={createItem.bind(null, category.id)}
                submitLabel="Añadir plato"
                successLabel="Plato añadido"
              />
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}