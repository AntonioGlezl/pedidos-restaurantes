import { db } from "@/lib/db";

// MVP: todos los restaurantes usan la misma zona horaria
export const TIMEZONE = "Europe/Madrid";

/* ───────── Utilidades de zona horaria (sin dependencias) ───────── */

function tzOffsetMs(utcMs: number, timeZone: string) {
  const base = Math.floor(utcMs / 1000) * 1000;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(base));
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const asUtc = Date.UTC(
    get("year"), get("month") - 1, get("day"),
    get("hour"), get("minute"), get("second")
  );
  return asUtc - base;
}

/** "2026-11-03" + "13:30" (hora de Madrid) -> instante UTC */
export function zonedToUtc(dateStr: string, time: string, timeZone = TIMEZONE) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let utc = guess - tzOffsetMs(guess, timeZone);
  utc = guess - tzOffsetMs(utc, timeZone); // segunda pasada por los cambios de hora
  return new Date(utc);
}

/** Fecha de hoy en Madrid como "YYYY-MM-DD" */
export function todayInTz(now = new Date(), timeZone = TIMEZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDays(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function dayOfWeek(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
}

export function isValidDateStr(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fromMinutes(total: number) {
  const h = Math.floor(total / 60).toString().padStart(2, "0");
  const m = (total % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/* ───────── Franjas ───────── */

export type Slot = {
  time: string;        // "13:30" (hora local)
  startsAt: Date;      // instante UTC
  remaining: number;   // pedidos que aún caben
  available: boolean;
};

type RestaurantForSlots = {
  id: string;
  acceptingOrders: boolean;
  minPrepMinutes: number;
};

/** Franjas de un día concreto, ya sin las pasadas ni las que no cumplen la antelación mínima. */
export async function getSlotsForDate(
  restaurant: RestaurantForSlots,
  dateStr: string,
  now = new Date()
): Promise<Slot[]> {
  if (!restaurant.acceptingOrders || !isValidDateStr(dateStr)) return [];

  const ranges = await db.pickupHours.findMany({
    where: { restaurantId: restaurant.id, dayOfWeek: dayOfWeek(dateStr) },
    orderBy: { opensAt: "asc" },
  });
  if (ranges.length === 0) return [];

  const dayStart = zonedToUtc(dateStr, "00:00");
  const dayEnd = zonedToUtc(addDays(dateStr, 1), "00:00");

  const counts = await db.order.groupBy({
    by: ["pickupAt"],
    where: {
      restaurantId: restaurant.id,
      pickupAt: { gte: dayStart, lt: dayEnd },
      status: { not: "CANCELLED" },
    },
    _count: { _all: true },
  });
  const taken = new Map(counts.map((c) => [c.pickupAt.getTime(), c._count._all]));

  const earliest = now.getTime() + restaurant.minPrepMinutes * 60_000;
  const slots: Slot[] = [];

  for (const range of ranges) {
    const end = toMinutes(range.closesAt);
    for (let t = toMinutes(range.opensAt); t < end; t += range.slotMinutes) {
      const time = fromMinutes(t);
      const startsAt = zonedToUtc(dateStr, time);
      if (startsAt.getTime() < earliest) continue;

      const remaining = Math.max(0, range.maxOrdersPerSlot - (taken.get(startsAt.getTime()) ?? 0));
      slots.push({ time, startsAt, remaining, available: remaining > 0 });
    }
  }
  return slots;
}

/** Próximos días (desde hoy) que tienen algún tramo configurado. */
export async function getOpenDates(restaurantId: string, daysAhead = 14, now = new Date()) {
  const configured = await db.pickupHours.findMany({
    where: { restaurantId },
    select: { dayOfWeek: true },
    distinct: ["dayOfWeek"],
  });
  const days = new Set(configured.map((h) => h.dayOfWeek));

  const today = todayInTz(now);
  const dates: string[] = [];
  for (let i = 0; i < daysAhead; i++) {
    const d = addDays(today, i);
    if (days.has(dayOfWeek(d))) dates.push(d);
  }
  return dates;
}