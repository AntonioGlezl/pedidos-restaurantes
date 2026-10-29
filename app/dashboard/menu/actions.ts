"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/restaurant";
import { categorySchema, menuItemSchema, parsePriceToCents } from "@/lib/validators";

export type FormState = {
  errors?: Record<string, string>;
  message?: string;
  ok?: boolean;
  values?: { name: string; description: string; price: string };
};

type Direction = "up" | "down";

function refresh(slug: string) {
  revalidatePath("/dashboard/menu");
  revalidatePath(`/${slug}`);
}

function toErrors(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function readItem(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
  };
}

/* ───────── Categorías ───────── */

export async function createCategory(formData: FormData): Promise<void> {
  const restaurant = await requireRestaurant();
  const parsed = categorySchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) return;

  const last = await db.category.findFirst({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await db.category.create({
    data: {
      restaurantId: restaurant.id,
      name: parsed.data.name,
      position: (last?.position ?? -1) + 1,
    },
  });
  refresh(restaurant.slug);
}

export async function renameCategory(id: string, formData: FormData): Promise<void> {
  const restaurant = await requireRestaurant();
  const parsed = categorySchema.safeParse({ name: String(formData.get("name") ?? "") });
  if (!parsed.success) return;

  await db.category.updateMany({
    where: { id, restaurantId: restaurant.id },
    data: { name: parsed.data.name },
  });
  refresh(restaurant.slug);
}

export async function deleteCategory(id: string): Promise<void> {
  const restaurant = await requireRestaurant();
  // Borra también sus platos (onDelete: Cascade)
  await db.category.deleteMany({ where: { id, restaurantId: restaurant.id } });
  refresh(restaurant.slug);
}

export async function moveCategory(id: string, direction: Direction): Promise<void> {
  const restaurant = await requireRestaurant();

  const siblings = await db.category.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const i = siblings.findIndex((c) => c.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return;

  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  await db.$transaction(
    siblings.map((c, index) =>
      db.category.update({ where: { id: c.id }, data: { position: index } })
    )
  );
  refresh(restaurant.slug);
}

/* ───────── Platos ───────── */

export async function createItem(
  categoryId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const restaurant = await requireRestaurant();
  const raw = readItem(formData);

  const category = await db.category.findFirst({
    where: { id: categoryId, restaurantId: restaurant.id },
    select: { id: true },
  });
  if (!category) return { message: "Categoría no encontrada", values: raw };

  const parsed = menuItemSchema.safeParse(raw);
  if (!parsed.success) return { errors: toErrors(parsed.error), values: raw };

  const last = await db.menuItem.findFirst({
    where: { categoryId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await db.menuItem.create({
    data: {
      categoryId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      priceCents: parsePriceToCents(parsed.data.price)!,
      position: (last?.position ?? -1) + 1,
    },
  });

  refresh(restaurant.slug);
  return { ok: true };
}

export async function updateItem(
  itemId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const restaurant = await requireRestaurant();
  const raw = readItem(formData);

  const parsed = menuItemSchema.safeParse(raw);
  if (!parsed.success) return { errors: toErrors(parsed.error), values: raw };

  const result = await db.menuItem.updateMany({
    where: { id: itemId, category: { restaurantId: restaurant.id } },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      priceCents: parsePriceToCents(parsed.data.price)!,
    },
  });
  if (result.count === 0) return { message: "Plato no encontrado", values: raw };

  refresh(restaurant.slug);
  return { ok: true };
}

export async function toggleItemAvailability(itemId: string): Promise<void> {
  const restaurant = await requireRestaurant();

  const item = await db.menuItem.findFirst({
    where: { id: itemId, category: { restaurantId: restaurant.id } },
    select: { available: true },
  });
  if (!item) return;

  await db.menuItem.update({
    where: { id: itemId },
    data: { available: !item.available },
  });
  refresh(restaurant.slug);
}

export async function deleteItem(itemId: string): Promise<void> {
  const restaurant = await requireRestaurant();
  await db.menuItem.deleteMany({
    where: { id: itemId, category: { restaurantId: restaurant.id } },
  });
  refresh(restaurant.slug);
}

export async function moveItem(itemId: string, direction: Direction): Promise<void> {
  const restaurant = await requireRestaurant();

  const item = await db.menuItem.findFirst({
    where: { id: itemId, category: { restaurantId: restaurant.id } },
    select: { categoryId: true },
  });
  if (!item) return;

  const siblings = await db.menuItem.findMany({
    where: { categoryId: item.categoryId },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const i = siblings.findIndex((s) => s.id === itemId);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return;

  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  await db.$transaction(
    siblings.map((s, index) =>
      db.menuItem.update({ where: { id: s.id }, data: { position: index } })
    )
  );
  refresh(restaurant.slug);
}