import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { AddToCart } from "./add-to-cart";
import { CartBar } from "./cart-bar";
import { CartInit } from "./cart-init";

export default function PublicRestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-gray-500">Cargando...</p>}>
      <RestaurantContent params={params} />
    </Suspense>
  );
}

async function RestaurantContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const restaurant = await db.restaurant.findUnique({
    where: { slug },
    include: {
      links: { orderBy: { position: "asc" } },
      categories: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: { items: { orderBy: [{ position: "asc" }, { id: "asc" }] } },
      },
    },
  });
  if (!restaurant) notFound();

  const color = restaurant.primaryColor;
  const categories = restaurant.categories.filter((c) => c.items.length > 0);

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-10">
      <CartInit slug={slug} />

      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{restaurant.name}</h1>
        {restaurant.description && (
          <p className="mt-2 text-gray-600">{restaurant.description}</p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          {[restaurant.address, restaurant.phone].filter(Boolean).join(" · ")}
        </p>
      </header>

      {restaurant.links.length > 0 && (
        <div className="mb-8 space-y-2">
          {restaurant.links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-full border px-4 py-2 text-center text-sm font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {!restaurant.acceptingOrders && (
        <p className="mb-6 rounded-md bg-amber-50 p-3 text-center text-sm text-amber-800">
          Ahora mismo no se aceptan pedidos para recoger.
        </p>
      )}

      {categories.length === 0 && (
        <p className="text-center text-gray-500">La carta todavía no está disponible.</p>
      )}

      <div className="space-y-8">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-3 border-b pb-2 text-xl font-semibold">{category.name}</h2>
            <ul className="divide-y">
              {category.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-4 py-3">
                  <div className={item.available ? "" : "opacity-50"}>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600">{item.description}</p>
                    )}
                    <p className="mt-1 text-sm font-medium">{formatPrice(item.priceCents)}</p>
                  </div>

                  {!item.available ? (
                    <span className="rounded bg-gray-200 px-2 py-0.5 text-xs">Agotado</span>
                  ) : restaurant.acceptingOrders ? (
                    <AddToCart
                      item={{ id: item.id, name: item.name, priceCents: item.priceCents }}
                      color={color}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {restaurant.acceptingOrders && <CartBar slug={slug} color={color} />}
    </main>
  );
}