import { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDateLabel } from "@/lib/format";
import { getOpenDates, getSlotsForDate, type Slot } from "@/lib/slots";
import { CheckoutForm } from "./checkout-form";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string | string[] }>;
};

export default function CheckoutPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<p className="p-8 text-center text-gray-500">Cargando...</p>}>
      <CheckoutContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function CheckoutContent({ params, searchParams }: Props) {
  const { slug } = await params;
  const { date } = await searchParams;

  const restaurant = await db.restaurant.findUnique({ where: { slug } });
  if (!restaurant) notFound();

  const dates = await getOpenDates(restaurant.id);
  const requested = typeof date === "string" ? date : undefined;

  let selectedDate: string | null = null;
  let slots: Slot[] = [];

  if (requested && dates.includes(requested)) {
    selectedDate = requested;
    slots = await getSlotsForDate(restaurant, requested);
  } else {
    // Por defecto, el primer día que tenga alguna hora libre
    for (const d of dates) {
      const s = await getSlotsForDate(restaurant, d);
      if (s.some((x) => x.available)) {
        selectedDate = d;
        slots = s;
        break;
      }
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <CheckoutForm
        slug={slug}
        restaurantName={restaurant.name}
        color={restaurant.primaryColor}
        acceptingOrders={restaurant.acceptingOrders}
        dates={dates.map((d) => ({ value: d, label: formatDateLabel(d) }))}
        selectedDate={selectedDate}
        slots={slots.map((s) => ({ time: s.time, available: s.available }))}
      />
    </main>
  );
}