"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRestaurant } from "@/lib/restaurant";
import { linkSchema, normalizeUrl, profileSchema, slugSchema } from "@/lib/validators";

export type SettingsState = {
  errors?: Record<string, string>;
  message?: string;
  ok?: boolean;
  values?: Record<string, string>;
};

const MAX_LINKS = 8;

function toErrors(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

function refresh(slug: string) {
  revalidatePath("/dashboard/page-settings");
  revalidatePath("/dashboard");
  revalidatePath(`/${slug}`);
}

/* ───────── Perfil ───────── */

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const restaurant = await requireRestaurant();

  const values = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    primaryColor: String(formData.get("primaryColor") ?? ""),
  };

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return { errors: toErrors(parsed.error), values };

  const d = parsed.data;
  await db.restaurant.update({
    where: { id: restaurant.id },
    data: {
      name: d.name,
      description: d.description || null,
      phone: d.phone || null,
      address: d.address || null,
      primaryColor: d.primaryColor,
    },
  });

  refresh(restaurant.slug);
  return { ok: true, values };
}

/* ───────── Dirección (slug) ───────── */

export async function updateSlug(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const restaurant = await requireRestaurant();
  const value = String(formData.get("slug") ?? "");
  const values = { slug: value };

  const parsed = slugSchema.safeParse(value);
  if (!parsed.success) return { errors: { slug: parsed.error.issues[0].message }, values };

  const slug = parsed.data;
  if (slug === restaurant.slug) return { ok: true, values };

  const taken = await db.restaurant.findUnique({ where: { slug } });
  if (taken) return { errors: { slug: "Esta dirección ya está en uso" }, values };

  try {
    await db.restaurant.update({ where: { id: restaurant.id }, data: { slug } });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { errors: { slug: "Esta dirección ya está en uso" }, values };
    }
    console.error(e);
    return { message: "No se pudo cambiar la dirección", values };
  }

  revalidatePath(`/${restaurant.slug}`); // la antigua deja de existir
  refresh(slug);
  return { ok: true, values };
}

/* ───────── Enlaces ───────── */

export async function addLink(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const restaurant = await requireRestaurant();

  const values = {
    label: String(formData.get("label") ?? ""),
    url: String(formData.get("url") ?? ""),
  };
  const parsed = linkSchema.safeParse(values);
  if (!parsed.success) return { errors: toErrors(parsed.error), values };

  const links = await db.link.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  if (links.length >= MAX_LINKS) {
    return { message: `Máximo ${MAX_LINKS} enlaces`, values };
  }

  await db.link.create({
    data: {
      restaurantId: restaurant.id,
      label: parsed.data.label,
      url: normalizeUrl(parsed.data.url)!,
      position: (links[0]?.position ?? -1) + 1,
    },
  });

  refresh(restaurant.slug);
  return { ok: true };
}

export async function deleteLink(id: string): Promise<void> {
  const restaurant = await requireRestaurant();
  await db.link.deleteMany({ where: { id, restaurantId: restaurant.id } });
  refresh(restaurant.slug);
}

export async function moveLink(id: string, direction: "up" | "down"): Promise<void> {
  const restaurant = await requireRestaurant();

  const siblings = await db.link.findMany({
    where: { restaurantId: restaurant.id },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const i = siblings.findIndex((l) => l.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= siblings.length) return;

  [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
  await db.$transaction(
    siblings.map((l, index) =>
      db.link.update({ where: { id: l.id }, data: { position: index } })
    )
  );
  refresh(restaurant.slug);
}