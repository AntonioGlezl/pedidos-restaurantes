"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validators";

export type RegisterState = {
  errors?: Record<string, string>;
  message?: string;
  values?: { restaurantName: string; slug: string; email: string };
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = {
    restaurantName: String(formData.get("restaurantName") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const values = {
    restaurantName: raw.restaurantName,
    slug: raw.slug,
    email: raw.email,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (!errors[key]) errors[key] = issue.message;
    }
    return { errors, values };
  }

  const { restaurantName, slug, email, password } = parsed.data;

  const [emailTaken, slugTaken] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.restaurant.findUnique({ where: { slug } }),
  ]);
  if (emailTaken) return { errors: { email: "Ya existe una cuenta con este email" }, values };
  if (slugTaken) return { errors: { slug: "Esta dirección ya está en uso" }, values };

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.create({
      data: {
        email,
        passwordHash,
        restaurant: { create: { name: restaurantName, slug } },
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return { message: "El email o la dirección ya están en uso", values };
    }
    console.error(e);
    return { message: "No se pudo crear la cuenta. Inténtalo de nuevo.", values };
  }

  // Inicia sesión y redirige. NO meter esto dentro del try/catch de arriba:
  // signIn lanza una redirección interna que debe propagarse.
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) {
      return { message: "Cuenta creada, pero no se pudo iniciar sesión. Entra desde /login.", values };
    }
    throw e;
  }
  return {};
}