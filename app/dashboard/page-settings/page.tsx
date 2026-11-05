import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/restaurant";
import { deleteLink, moveLink } from "./actions";
import { LinkForm, ProfileForm, SlugForm } from "./forms";

export default function PageSettingsPage() {
  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Mi página</h1>
      <Suspense fallback={<p className="text-gray-500">Cargando...</p>}>
        <SettingsContent />
      </Suspense>
    </section>
  );
}

const small = "rounded border px-2 py-1 text-sm disabled:opacity-30";

async function SettingsContent() {
  const restaurant = await requireRestaurant();
  const links = await db.link.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-600">
        Tu página pública:{" "}
        <Link href={`/${restaurant.slug}`} target="_blank" className="underline">
          /{restaurant.slug}
        </Link>
      </p>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-semibold">Información</h2>
        <ProfileForm
          initial={{
            name: restaurant.name,
            description: restaurant.description ?? "",
            phone: restaurant.phone ?? "",
            address: restaurant.address ?? "",
            primaryColor: restaurant.primaryColor,
          }}
        />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-1 text-lg font-semibold">Enlaces</h2>
        <p className="mb-4 text-sm text-gray-600">
          Botones que aparecen en la parte superior de tu página: Instagram, Google Maps, web...
        </p>

        {links.length === 0 ? (
          <p className="mb-4 text-sm text-gray-500">Todavía no has añadido enlaces.</p>
        ) : (
          <ul className="mb-4 divide-y">
            {links.map((link, i) => (
              <li key={link.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <p className="font-medium">{link.label}</p>
                  <p className="truncate text-sm text-gray-500">{link.url}</p>
                </div>
                <div className="flex gap-1">
                  <form action={moveLink.bind(null, link.id, "up")}>
                    <button className={small} disabled={i === 0} aria-label="Subir enlace">↑</button>
                  </form>
                  <form action={moveLink.bind(null, link.id, "down")}>
                    <button className={small} disabled={i === links.length - 1} aria-label="Bajar enlace">↓</button>
                  </form>
                  <form action={deleteLink.bind(null, link.id)}>
                    <button className={`${small} text-red-600`}>Quitar</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <LinkForm />
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-semibold">Dirección de tu página</h2>
        <SlugForm current={restaurant.slug} />
      </div>
    </div>
  );
}