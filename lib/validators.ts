import { z } from "zod";

export const RESERVED_SLUGS = [
  "login", "register", "dashboard", "api", "admin", "app", "_next",
  "about", "pricing", "contact", "terms", "privacy", "help", "support",
];

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export const loginSchema = z.object({
  email: z.string().email("Email no válido"),
  password: z.string().min(1, "Introduce la contraseña"),
});

export const registerSchema = z.object({
  restaurantName: z.string().trim().min(2, "Mínimo 2 caracteres").max(60),
  slug: z
    .string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(40, "Máximo 40 caracteres")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones")
    .refine((s) => !RESERVED_SLUGS.includes(s), "Este nombre está reservado"),
  email: z.string().trim().toLowerCase().email("Email no válido"),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Escribe un nombre").max(40, "Máximo 40 caracteres"),
});

// "12,50" o "12.5" -> 1250. Devuelve null si no es válido.
export function parsePriceToCents(input: string): number | null {
  const v = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(v)) return null;
  const cents = Math.round(parseFloat(v) * 100);
  return cents > 0 ? cents : null;
}

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Escribe un nombre").max(80, "Máximo 80 caracteres"),
  description: z.string().trim().max(300, "Máximo 300 caracteres"),
  price: z
    .string()
    .refine((v) => parsePriceToCents(v) !== null, "Precio no válido (ej. 12,50)"),
});

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

export const SLOT_OPTIONS = [10, 15, 20, 30, 60];

export const hoursSchema = z
  .object({
    dayOfWeek: z.coerce.number().int().min(0).max(6),
    opensAt: z.string().regex(timeRegex, "Hora no válida"),
    closesAt: z.string().regex(timeRegex, "Hora no válida"),
    slotMinutes: z.coerce
      .number()
      .refine((v) => SLOT_OPTIONS.includes(v), "Duración no válida"),
    maxOrdersPerSlot: z.coerce
      .number()
      .int("Debe ser un número entero")
      .min(1, "Mínimo 1")
      .max(50, "Máximo 50"),
  })
  .refine((d) => d.opensAt < d.closesAt, {
    path: ["closesAt"],
    message: "Debe ser posterior a la hora de apertura",
  });

  export const orderSchema = z.object({
  customerName: z.string().trim().min(2, "Escribe tu nombre").max(60, "Máximo 60 caracteres"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{9,16}$/, "Teléfono no válido"),
  customerEmail: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === "" || z.string().email().safeParse(v).success, "Email no válido"),
  notes: z.string().trim().max(300, "Máximo 300 caracteres"),
});

export const cartSchema = z
  .array(
    z.object({
      id: z.string().min(1).max(40),
      qty: z.coerce.number().int().min(1).max(20),
    })
  )
  .min(1)
  .max(50);

  /* ───────── Personalización de la página ───────── */

export function normalizeUrl(input: string): string | null {
  let v = input.trim();
  if (!v || v.length > 300) return null;
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  try {
    const u = new URL(v);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// El texto de los botones es blanco: el color no puede ser demasiado claro
export function isReadableColor(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b <= 0.3;
}

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Mínimo 2 caracteres").max(60, "Máximo 60 caracteres"),
  description: z.string().trim().max(200, "Máximo 200 caracteres"),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9 ]{9,16}$/.test(v), "Teléfono no válido"),
  address: z.string().trim().max(120, "Máximo 120 caracteres"),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color no válido")
    .refine(isReadableColor, "Color demasiado claro: el texto blanco no se leería"),
});

export const slugSchema = registerSchema.shape.slug;

export const linkSchema = z.object({
  label: z.string().trim().min(1, "Escribe el texto del botón").max(40, "Máximo 40 caracteres"),
  url: z.string().refine((v) => normalizeUrl(v) !== null, "Enlace no válido (ej. instagram.com/mirestaurante)"),
});