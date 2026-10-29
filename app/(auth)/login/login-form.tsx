"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email"
          className="w-full rounded-md border px-3 py-2" required />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password"
          className="w-full rounded-md border px-3 py-2" required />
      </div>
      <button type="submit" disabled={pending}
        className="w-full rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-60">
        {pending ? "Entrando..." : "Entrar"}
      </button>
      <p className="text-center text-sm text-gray-600">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="underline">Regístrate</Link>
      </p>
    </form>
  );
}