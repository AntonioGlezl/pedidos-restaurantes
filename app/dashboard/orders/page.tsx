import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/restaurant";
import { formatLongDate, formatPrice, formatTime } from "@/lib/format";
import { addDays, isValidDateStr, todayInTz, zonedToUtc } from "@/lib/slots";
import { ConfirmButton } from "../menu/confirm-button";
import { updateOrderStatus, type Status } from "./actions";
import { AutoRefresh } from "./auto-refresh";

type Props = { searchParams: Promise<{ date?: string | string[] }> };

const STATUS: Record<Status, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
  CONFIRMED: { label: "Confirmado", cls: "bg-blue-100 text-blue-800" },
  READY: { label: "Listo", cls: "bg-green-100 text-green-800" },
  PICKED_UP: { label: "Recogido", cls: "bg-gray-200 text-gray-700" },
  CANCELLED: { label: "Cancelado", cls: "bg-red-100 text-red-700" },
};

const ACTIONS: Record<Status, { to: Status; label: string }[]> = {
  PENDING: [{ to: "CONFIRMED", label: "Confirmar" }],
  CONFIRMED: [{ to: "READY", label: "Marcar listo" }],
  READY: [{ to: "PICKED_UP", label: "Marcar recogido" }],
  PICKED_UP: [],
  CANCELLED: [],
};

export default function OrdersPage({ searchParams }: Props) {
  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Pedidos</h1>
      <Suspense fallback={<p className="text-gray-500">Cargando pedidos...</p>}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </section>
  );
}

async function OrdersContent({ searchParams }: Props) {
  const restaurant = await requireRestaurant();
  const { date: rawDate } = await searchParams;

  const today = todayInTz();
  const date = typeof rawDate === "string" && isValidDateStr(rawDate) ? rawDate : today;

  const orders = await db.order.findMany({
    where: {
      restaurantId: restaurant.id,
      pickupAt: { gte: zonedToUtc(date, "00:00"), lt: zonedToUtc(addDays(date, 1), "00:00") },
    },
    orderBy: [{ pickupAt: "asc" }, { number: "asc" }],
    include: { items: true },
  });

  const active = orders.filter((o) => o.status !== "CANCELLED");
  const pending = orders.filter((o) => o.status === "PENDING").length;
  const total = active.reduce((sum, o) => sum + o.totalCents, 0);

  const link = "rounded-md border px-3 py-1.5 text-sm";

  return (
    <div className="space-y-6">
      <AutoRefresh />

      {/* Navegación por días */}
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/dashboard/orders?date=${addDays(date, -1)}`} className={link}>←</Link>
        <Link href="/dashboard/orders" className={link}>Hoy</Link>
        <Link href={`/dashboard/orders?date=${addDays(date, 1)}`} className={link}>→</Link>
        <form action="/dashboard/orders" className="ml-auto flex items-center gap-2">
          <input type="date" name="date" defaultValue={date} className="rounded-md border px-2 py-1.5 text-sm" />
          <button className={link}>Ir</button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold capitalize">{formatLongDate(date)}</h2>
        <p className="text-sm text-gray-600">
          {active.length} {active.length === 1 ? "pedido" : "pedidos"} · {formatPrice(total)}
          {pending > 0 && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-amber-800">
              {pending} por confirmar
            </span>
          )}
        </p>
      </div>

      {orders.length === 0 && (
        <p className="rounded-lg border p-6 text-center text-gray-500">
          No hay pedidos para este día.
        </p>
      )}

      <ul className="space-y-4">
        {orders.map((order) => {
          const status = order.status as Status;
          const actions = ACTIONS[status];
          const canCancel = status !== "PICKED_UP" && status !== "CANCELLED";

          return (
            <li key={order.id} className={`rounded-lg border p-4 ${status === "CANCELLED" ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold">{formatTime(order.pickupAt)}</span>
                  <span className="text-sm text-gray-500">Pedido #{order.number}</span>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS[status].cls}`}>
                  {STATUS[status].label}
                </span>
              </div>

              <div className="mt-2 text-sm">
                <p className="font-medium">{order.customerName}</p>
                <p>
                  <a href={`tel:${order.customerPhone.replace(/\s/g, "")}`} className="underline">
                    {order.customerPhone}
                  </a>
                  {order.customerEmail && <span className="text-gray-600"> · {order.customerEmail}</span>}
                </p>
              </div>

              <ul className="mt-3 divide-y rounded-md bg-gray-50 text-sm">
                {order.items.map((i) => (
                  <li key={i.id} className="flex justify-between px-3 py-1.5">
                    <span>{i.quantity} × {i.nameSnapshot}</span>
                    <span>{formatPrice(i.priceCentsSnapshot * i.quantity)}</span>
                  </li>
                ))}
              </ul>

              {order.notes && (
                <p className="mt-3 rounded-md bg-amber-50 p-2 text-sm text-amber-900">
                  <strong>Nota:</strong> {order.notes}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">Total: {formatPrice(order.totalCents)}</p>
                <div className="flex gap-2">
                  {actions.map((a) => (
                    <form key={a.to} action={updateOrderStatus.bind(null, order.id, a.to)}>
                      <button className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white">
                        {a.label}
                      </button>
                    </form>
                  ))}
                  {canCancel && (
                    <form action={updateOrderStatus.bind(null, order.id, "CANCELLED")}>
                      <ConfirmButton
                        message={`¿Cancelar el pedido #${order.number} de ${order.customerName}?`}
                        className="rounded-md border px-3 py-1.5 text-sm text-red-600"
                      >
                        Cancelar
                      </ConfirmButton>
                    </form>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}