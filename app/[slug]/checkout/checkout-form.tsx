"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";
import { createOrder, type OrderState } from "./actions";

type Props = {
  slug: string;
  restaurantName: string;
  color: string;
  acceptingOrders: boolean;
  dates: { value: string; label: string }[];
  selectedDate: string | null;
  slots: { time: string; available: boolean }[];
};

export function CheckoutForm({
  slug,
  restaurantName,
  color,
  acceptingOrders,
  dates,
  selectedDate,
  slots,
}: Props) {
  const [state, action, pending] = useActionState(createOrder.bind(null, slug), {} as OrderState);
  const [ready, setReady] = useState(false);

  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const decrease = useCart((s) => s.decrease);
  const remove = useCart((s) => s.remove);

  useEffect(() => {
    let active = true;
    Promise.resolve(useCart.persist.rehydrate()).then(() => {
      useCart.getState().setSlug(slug);
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const total = lines.reduce((n, l) => n + l.qty * l.priceCents, 0);
  const err = state.errors ?? {};

  if (!ready) return <p className="text-gray-500">Cargando tu pedido...</p>;

  if (!acceptingOrders) {
    return (
      <div className="text-center">
        <p className="mb-4">Ahora mismo {restaurantName} no acepta pedidos.</p>
        <Link href={`/${slug}`} className="underline">Volver a la carta</Link>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="text-center">
        <p className="mb-4">Tu pedido está vacío.</p>
        <Link href={`/${slug}`} className="underline">Volver a la carta</Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">
      <div>
        <Link href={`/${slug}`} className="text-sm underline">← Volver a la carta</Link>
        <h1 className="mt-2 text-2xl font-bold">Tu pedido en {restaurantName}</h1>
      </div>

      {state.message && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}

      {/* Resumen del carrito */}
      <section>
        <ul className="divide-y rounded-lg border">
          {lines.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-sm text-gray-600">{formatPrice(l.priceCents)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => decrease(l.id)} aria-label="Quitar uno"
                  className="h-8 w-8 rounded-full border text-lg leading-none">−</button>
                <span className="w-5 text-center">{l.qty}</span>
                <button type="button"
                  onClick={() => add({ id: l.id, name: l.name, priceCents: l.priceCents })}
                  aria-label="Añadir uno"
                  className="h-8 w-8 rounded-full border text-lg leading-none">+</button>
                <button type="button" onClick={() => remove(l.id)}
                  className="ml-2 text-sm text-red-600 underline">Quitar</button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-right text-lg font-semibold">Total: {formatPrice(total)}</p>
        <p className="text-right text-sm text-gray-500">Se paga al recoger en el local.</p>
      </section>

      {/* Día y hora */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">¿Cuándo recoges?</h2>

        {!selectedDate ? (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            No hay horas disponibles en los próximos días.
          </p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {dates.map((d) => {
                const active = d.value === selectedDate;
                return (
                  <Link
                    key={d.value}
                    href={`/${slug}/checkout?date=${d.value}`}
                    scroll={false}
                    style={active ? { backgroundColor: color, borderColor: color } : undefined}
                    className={`rounded-full border px-3 py-1 text-sm ${active ? "text-white" : ""}`}
                  >
                    {d.label}
                  </Link>
                );
              })}
            </div>

            <input type="hidden" name="date" value={selectedDate} />

            {slots.length === 0 ? (
              <p className="text-sm text-gray-600">No quedan horas libres este día.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <label
                    key={`${selectedDate}-${s.time}`}
                    className={`cursor-pointer rounded-md border px-2 py-2 text-center text-sm has-[:checked]:text-white ${
                      s.available ? "" : "cursor-not-allowed opacity-40"
                    }`}
                    style={{ ["--c" as string]: color }}
                  >
                    <input
                      type="radio"
                      name="time"
                      value={s.time}
                      disabled={!s.available}
                      required
                      className="peer sr-only"
                    />
                    <span className="block peer-checked:font-semibold">{s.time}</span>
                    {!s.available && <span className="block text-xs">Completo</span>}
                  </label>
                ))}
              </div>
            )}
            {err.time && <p className="mt-2 text-sm text-red-600">{err.time}</p>}
          </>
        )}
      </section>

      {/* Datos del cliente */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tus datos</h2>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="customerName">Nombre</label>
          <input id="customerName" name="customerName" required maxLength={60}
            defaultValue={state.values?.customerName ?? ""}
            autoComplete="name" className="w-full rounded-md border px-3 py-2" />
          {err.customerName && <p className="mt-1 text-sm text-red-600">{err.customerName}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="customerPhone">Teléfono</label>
          <input id="customerPhone" name="customerPhone" type="tel" required
            defaultValue={state.values?.customerPhone ?? ""}
            autoComplete="tel" className="w-full rounded-md border px-3 py-2" />
          {err.customerPhone && <p className="mt-1 text-sm text-red-600">{err.customerPhone}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="customerEmail">
            Email <span className="font-normal text-gray-500">(opcional)</span>
          </label>
          <input id="customerEmail" name="customerEmail" type="email"
            defaultValue={state.values?.customerEmail ?? ""}
            autoComplete="email" className="w-full rounded-md border px-3 py-2" />
          {err.customerEmail && <p className="mt-1 text-sm text-red-600">{err.customerEmail}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="notes">
            Comentarios <span className="font-normal text-gray-500">(opcional)</span>
          </label>
          <textarea id="notes" name="notes" rows={3} maxLength={300}
            defaultValue={state.values?.notes ?? ""}
            className="w-full rounded-md border px-3 py-2" />
          {err.notes && <p className="mt-1 text-sm text-red-600">{err.notes}</p>}
        </div>
      </section>

      <input type="hidden" name="cart"
        value={JSON.stringify(lines.map((l) => ({ id: l.id, qty: l.qty })))} />

      <button type="submit" disabled={pending || !selectedDate}
        style={{ backgroundColor: color }}
        className="w-full rounded-full px-4 py-3 font-medium text-white disabled:opacity-60">
        {pending ? "Enviando pedido..." : `Confirmar pedido · ${formatPrice(total)}`}
      </button>
    </form>
  );
}