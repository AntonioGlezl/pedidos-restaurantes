"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/restaurant";

export type Status = "PENDING" | "CONFIRMED" | "READY" | "PICKED_UP" | "CANCELLED";

const NEXT: Record<Status, Status[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY", "CANCELLED"],
  READY: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: [],
  CANCELLED: [],
};

export async function updateOrderStatus(orderId: string, target: Status): Promise<void> {
  const restaurant = await requireRestaurant();
  if (!(target in NEXT)) return;

  // Estados desde los que se puede llegar a `target`
  const allowedFrom = (Object.keys(NEXT) as Status[]).filter((s) => NEXT[s].includes(target));
  if (allowedFrom.length === 0) return;

  await db.order.updateMany({
    where: {
      id: orderId,
      restaurantId: restaurant.id,
      status: { in: allowedFrom },
    },
    data: { status: target },
  });

  revalidatePath("/dashboard/orders");
}