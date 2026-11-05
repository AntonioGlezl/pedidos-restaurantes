import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPickup, formatPrice } from "@/lib/format";
import { ClearCart } from "./clear-cart";

type Props = { params: Promise<{ slug: string; orderId: string }> };

export default function ConfirmationPage({ params }: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-gray-500">Cargando...</p>}>
      <ConfirmationContent params={params} />
    </Suspense>
  );
}

async function ConfirmationContent({ params }: Props) {
  const { slug, orderId } = await params;

  const order = await db.order.findFirst({
    where: { id: orderId, restaurant: { slug } },
    include: { items: true, restaurant: true },
  });
  if (!order) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <ClearCart />

      <div className="mb-6 text-center">
        <p className="text-4xl">✅</p>
        <h1 className="mt-2 text-2xl font-bold">¡Pedido recibido!</h1>
        <p className="text-gray-600">Pedido nº {order.number} en {order.restaurant.name}</p>
      </div>

      <section className="mb-6 rounded-lg border p-4">
        <p className="text-sm text-gray-500">Recogida</p>
        <p className="text-lg font-semibold capitalize">{formatPickup(order.pickupAt)}</p>
        {order.restaurant.address && (
          <p className="mt-1 text-sm text-gray-600">{order.restaurant.address}</p>
        )}
        {order.restaurant.phone && (
          <p className="text-sm text-gray-600">Tel. {order.restaurant.phone}</p>
        )}
      </section>

      <section className="mb-6">
        <ul className="divide-y rounded-lg border">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between p-3">
              <span>{i.quantity} × {i.nameSnapshot}</span>
              <span>{formatPrice(i.priceCentsSnapshot * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-lg font-semibold">
          Total: {formatPrice(order.totalCents)}
        </p>
        <p className="text-right text-sm text-gray-500">Se paga al recoger.</p>
      </section>

      <p className="mb-6 text-center text-sm text-gray-600">
        A nombre de <strong>{order.customerName}</strong>. Guarda esta página o haz una
        captura por si la necesitas al recoger.
      </p>

      <div className="text-center">
        <Link href={`/${slug}`} className="underline">Volver a la carta</Link>
      </div>
    </main>
  );
}