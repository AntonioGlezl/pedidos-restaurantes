"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/restaurant";
import { hoursSchema } from "@/lib/validators";

export type HoursState = {
  errors?: Record<string, string>;
  message?: string;
  ok?: boolean;
};

function refresh(slug: string) {
  revalidatePath("/dashboard/schedule");
  revalidatePath(`/${slug}`);
}

export async function updateSettings(formData: FormData): Promise<void> {
  const restaurant = await requireRestaurant();

  const accepting = formData.get("acceptingOrders") === "on";
  const raw = Number(formData.get("minPrepMinutes"));
  const minPrepMinutes = Number.isFinite(raw) ? Math.min(1440, Math.max(0, Math.round(raw))) : 30;

  await db.restaurant.update({
    where: { id: restaurant.id },
    data: { acceptingOrders: accepting, minPrepMinutes },
  });
  refresh(restaurant.slug);
}

export async function addHours(
  dayOfWeek: number,
  _prev: HoursState,
  formData: FormData
): Promise<HoursState> {
  const restaurant = await requireRestaurant();

  const parsed = hoursSchema.safeParse({
    dayOfWeek,
    opensAt: String(formData.get("opensAt") ?? ""),
    closesAt: String(formData.get("closesAt") ?? ""),
    slotMinutes: String(formData.get("slotMinutes") ?? ""),
    maxOrdersPerSlot: String(formData.get("maxOrdersPerSlot") ?? ""),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = issue.message;
    }
    return { errors };
  }

  const data = parsed.data;

  // Los tramos de un mismo día no pueden solaparse
  const existing = await db.pickupHours.findMany({
    where: { restaurantId: restaurant.id, dayOfWeek: data.dayOfWeek },
  });
  const overlaps = existing.some(
    (h) => data.opensAt < h.closesAt && h.opensAt < data.closesAt
  );
  if (overlaps) {
    return { message: "Este tramo se solapa con otro del mismo día" };
  }

  await db.pickupHours.create({
    data: { restaurantId: restaurant.id, ...data },
  });

  refresh(restaurant.slug);
  return { ok: true };
}

export async function deleteHours(id: string): Promise<void> {
  const restaurant = await requireRestaurant();
  await db.pickupHours.deleteMany({ where: { id, restaurantId: restaurant.id } });
  refresh(restaurant.slug);
}