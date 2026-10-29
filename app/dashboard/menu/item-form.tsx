"use client";

import { useActionState } from "react";
import type { FormState } from "./actions";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: { name: string; description: string; price: string };
  submitLabel: string;
  successLabel: string;
};

export function ItemForm({ action, initial, submitLabel, successLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const err = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-3">
      {state.message && (
        <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{state.message}</p>
      )}
      {state.ok && <p className="text-sm text-green-700">{successLabel}</p>}

      <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div>
          <input
            name="name"
            placeholder="Nombre del plato"
            defaultValue={state.values?.name ?? initial?.name ?? ""}
            maxLength={80}
            required
            className="w-full rounded-md border px-3 py-2"
          />
          {err.name && <p className="mt-1 text-sm text-red-600">{err.name}</p>}
        </div>
        <div>
          <input
            name="price"
            placeholder="Precio (12,50)"
            inputMode="decimal"
            defaultValue={state.values?.price ?? initial?.price ?? ""}
            required
            className="w-full rounded-md border px-3 py-2"
          />
          {err.price && <p className="mt-1 text-sm text-red-600">{err.price}</p>}
        </div>
      </div>

      <div>
        <textarea
          name="description"
          placeholder="Descripción (opcional)"
          defaultValue={state.values?.description ?? initial?.description ?? ""}
          maxLength={300}
          rows={2}
          className="w-full rounded-md border px-3 py-2"
        />
        {err.description && <p className="mt-1 text-sm text-red-600">{err.description}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}