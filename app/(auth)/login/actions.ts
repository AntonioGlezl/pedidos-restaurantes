"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(
  _prev: { message?: string },
  formData: FormData
): Promise<{ message?: string }> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) return { message: "Email o contraseña incorrectos" };
    throw e; // la redirección de éxito debe propagarse
  }
  return {};
}