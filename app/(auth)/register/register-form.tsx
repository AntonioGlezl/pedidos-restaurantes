"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";
import { slugify } from "@/lib/validators";

const initial: RegisterState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);
  const [name, setName] = useState(state.values?.restaurantName ?? "");
  const [slug, setSlug] = useState(state.values?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="restaurantName">
          Nombre del restaurante
        </label>
        <input
          id="restaurantName"
          name="restaurantName"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
          className="w-full rounded-md border px-3 py-2"
          required
        />
        {err.restaurantName && <p className="mt-1 text-sm text-red-600">{err.restaurantName}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="slug">
          Dirección de tu página
        </label>
        <div className="flex items-center rounded-md border">
          <span className="pl-3 text-sm text-gray-500">tuapp.com/</span>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            className="w-full rounded-md px-1 py-2 outline-none"
            required
          />
        </div>
        {err.slug && <p className="mt-1 text-sm text-red-600">{err.slug}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={state.values?.email}
          autoComplete="email"
          className="w-full rounded-md border px-3 py-2"
          required
        />
        {err.email && <p className="mt-1 text-sm text-red-600">{err.email}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-md border px-3 py-2"
          required
        />
        {err.password && <p className="mt-1 text-sm text-red-600">{err.password}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-black px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creando cuenta..." : "Crear cuenta"}
      </button>

      <p className="text-center text-sm text-gray-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="underline">Entra aquí</Link>
      </p>
    </form>
  );
}