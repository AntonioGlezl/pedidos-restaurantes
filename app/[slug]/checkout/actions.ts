"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { addDays, getSlotsForDate, todayInTz } from "@/lib/slots";
import { cartSchema, orderSchema } from "@/lib/validators";

export type OrderState = {
  errors?: Record<string, string>;
  message?: string;
  values?: {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    notes: string;
  };
};

class SlotFullError extends Error {}

export async function createOrder(
  slug: string,
  _prev: OrderState,
  formData: FormData
): Promise<OrderState> {
  const values = {
    customerName: String(formData.get("customerName") ?? ""),
    customerPhone: String(formData.get("customerPhone") ?? ""),
    customerEmail: String(formData.get("customerEmail") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");

  // 1. Datos del cliente
  const parsed = orderSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = issue.message;
    }
    return { errors, values };
  }
  if (!date || !time) {
    return { errors: { time: "Elige día y hora de recogida" }, values };
  }

  // 2. Carrito (solo ids y cantidades)
  const merged = new Map<string, number>();
  try {
    const cart = cartSchema.parse(JSON.parse(String(formData.get("cart") ?? "[]")));
    for (const line of cart) {
      merged.set(line.id, Math.min(20, (merged.get(line.id) ?? 0) + line.qty));
    }
  } catch {
    return { message: "No se pudo leer tu pedido. Vuelve a la carta e inténtalo de nuevo.", values };
  }

  // 3. Restaurante
  const restaurant = await db.restaurant.findUnique({ where: { slug } });
  if (!restaurant) return { message: "Restaurante no encontrado", values };
  if (!restaurant.acceptingOrders) {
    return { message: "Ahora mismo no se aceptan pedidos", values };
  }

  // 4. Platos: deben existir, estar disponibles y ser de ESTE restaurante
  const ids = [...merged.keys()];
  const menuItems = await db.menuItem.findMany({
    where: { id: { in: ids }, available: true, category: { restaurantId: restaurant.id } },
  });
  if (menuItems.length !== ids.length) {
    return {
      message: "Algún plato ya no está disponible. Vuelve a la carta y revisa tu pedido.",
      values,
    };
  }

  // 5. Fecha dentro de la ventana permitida (hoy + 13 días) y franja libre
  const today = todayInTz();
  if (date < today || date > addDays(today, 13)) {
    return { errors: { time: "Esa fecha no es válida" }, values };
  }
  const slots = await getSlotsForDate(restaurant, date);
  const slot = slots.find((s) => s.time === time);
  if (!slot || !slot.available) {
    return { errors: { time: "Esa hora ya no está disponible. Elige otra." }, values };
  }

  // 6. Crear el pedido comprobando la capacidad otra vez DENTRO de la transacción,
  //    para que dos clientes no se queden con la última plaza a la vez.
  const totalCents = menuItems.reduce((sum, m) => sum + m.priceCents * merged.get(m.id)!, 0);
  let orderId: string;

  try {
    const order = await db.$transaction(
      async (tx) => {
        const taken = await tx.order.count({
          where: {
            restaurantId: restaurant.id,
            pickupAt: slot.startsAt,
            status: { not: "CANCELLED" },
          },
        });
        if (taken >= slot.capacity) throw new SlotFullError();

        const last = await tx.order.findFirst({
          where: { restaurantId: restaurant.id },
          orderBy: { number: "desc" },
          select: { number: true },
        });

        return tx.order.create({
          data: {
            restaurantId: restaurant.id,
            number: (last?.number ?? 0) + 1,
            customerName: parsed.data.customerName,
            customerPhone: parsed.data.customerPhone,
            customerEmail: parsed.data.customerEmail || null,
            notes: parsed.data.notes || null,
            pickupAt: slot.startsAt,
            totalCents,
            items: {
              create: menuItems.map((m) => ({
                menuItemId: m.id,
                nameSnapshot: m.name,
                priceCentsSnapshot: m.priceCents,
                quantity: merged.get(m.id)!,
              })),
            },
          },
          select: { id: true },
        });
      },
      { isolationLevel: "Serializable" }
    );
    orderId = order.id;
  } catch (e) {
    if (e instanceof SlotFullError) {
      return { errors: { time: "Esa franja se acaba de llenar. Elige otra hora." }, values };
    }
    const code = (e as { code?: string }).code;
    if (code === "P2034" || code === "P2002") {
      return { message: "Hubo mucha demanda en ese momento. Inténtalo de nuevo.", values };
    }
    console.error(e);
    return { message: "No se pudo crear el pedido. Inténtalo de nuevo.", values };
  }

  // Fuera del try/catch: redirect lanza una excepción interna que debe propagarse
  redirect(`/${slug}/confirmacion/${orderId}`);
}