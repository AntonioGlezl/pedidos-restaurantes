"use client";

import { useActionState } from "react";
import { addLink, updateProfile, updateSlug, type SettingsState } from "./actions";

const input = "w-full rounded-md border px-3 py-2";
const btn =
  "rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

/* ───────── Perfil ───────── */

type Profile = {
  name: string;
  description: string;
  phone: string;
  address: string;
  primaryColor: string;
};

export function ProfileForm({ initial }: { initial: Profile }) {
  const [state, action, pending] = useActionState(updateProfile, {} as SettingsState);
  const err = state.errors ?? {};
  const v = (k: keyof Profile) => state.values?.[k] ?? initial[k];

  return (
    <form action={action} className="space-y-4">
      {state.message && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}
      {state.ok && <p className="text-sm text-green-700">Cambios guardados</p>}

      <Field label="Nombre del restaurante" error={err.name}>
        <input name="name" defaultValue={v("name")} maxLength={60} required className={input} />
      </Field>

      <Field label="Descripción (opcional)" error={err.description}>
        <textarea name="description" defaultValue={v("description")} maxLength={200} rows={2}
          placeholder="Cocina casera, pizzas al horno de leña..." className={input} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Teléfono (opcional)" error={err.phone}>
          <input name="phone" type="tel" defaultValue={v("phone")} className={input} />
        </Field>
        <Field label="Dirección del local (opcional)" error={err.address}>
          <input name="address" defaultValue={v("address")} maxLength={120} className={input} />
        </Field>
      </div>

      <Field label="Color principal" error={err.primaryColor}>
        <input name="primaryColor" type="color" defaultValue={v("primaryColor")}
          className="h-10 w-20 cursor-pointer rounded-md border p-1" />
        <p className="mt-1 text-xs text-gray-500">
          Se usa en los botones de tu página. Elige un color oscuro o medio para que el texto blanco se lea bien.
        </p>
      </Field>

      <button type="submit" disabled={pending} className={btn}>
        {pending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}

/* ───────── Dirección (slug) ───────── */

export function SlugForm({ current }: { current: string }) {
  const [state, action, pending] = useActionState(updateSlug, {} as SettingsState);

  return (
    <form action={action} className="space-y-3">
      {state.message && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.message}</p>
      )}
      {state.ok && <p className="text-sm text-green-700">Dirección actualizada</p>}

      <div className="flex items-center rounded-md border">
        <span className="pl-3 text-sm text-gray-500">tuapp.com/</span>
        <input name="slug" defaultValue={state.values?.slug ?? current} maxLength={40} required
          className="w-full rounded-md px-1 py-2 outline-none" />
      </div>
      {state.errors?.slug && <p className="text-sm text-red-600">{state.errors.slug}</p>}

      <p className="text-xs text-amber-700">
        Si la cambias, el enlace anterior dejará de funcionar. Actualiza tu Instagram, Google
        Maps, códigos QR, etc.
      </p>

      <button type="submit" disabled={pending} className={btn}>
        {pending ? "Guardando..." : "Cambiar dirección"}
      </button>
    </form>
  );
}

/* ───────── Nuevo enlace ───────── */

export function LinkForm() {
  const [state, action, pending] = useActionState(addLink, {} as SettingsState);
  const err = state.errors ?? {};

  return (
    <form action={action} className="space-y-3">
      {state.message && (
        <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{state.message}</p>
      )}
      {state.ok && <p className="text-sm text-green-700">Enlace añadido</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <input name="label" placeholder="Texto (ej. Instagram)" maxLength={40} required
            defaultValue={state.values?.label ?? ""} className={input} />
          {err.label && <p className="mt-1 text-sm text-red-600">{err.label}</p>}
        </div>
        <div>
          <input name="url" placeholder="instagram.com/mirestaurante" required
            defaultValue={state.values?.url ?? ""} className={input} />
          {err.url && <p className="mt-1 text-sm text-red-600">{err.url}</p>}
        </div>
      </div>

      <button type="submit" disabled={pending} className={btn}>
        {pending ? "Añadiendo..." : "Añadir enlace"}
      </button>
    </form>
  );
}