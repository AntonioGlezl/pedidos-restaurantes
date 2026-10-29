"use client";

import { useActionState } from "react";
import type { HoursState } from "./actions";
import { SLOT_OPTIONS } from "@/lib/validators";

export function HoursForm({
  action,
}: {
  action: (prev: HoursState, formData: FormData) => Promise<HoursState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const err = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-2">
      {state.message && (
        <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{state.message}</p>
      )}
      {state.ok && <p className="text-sm text-green-700">Tramo añadido</p>}

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-[black]">
          Desde
          <input name="opensAt" type="time" defaultValue="13:00" required
            className="mt-1 block rounded-md border px-2 py-1" />
        </label>
        <label className="text-sm text-[black]">
          Hasta
          <input name="closesAt" type="time" defaultValue="16:00" required
            className="mt-1 block rounded-md border px-2 py-1" />
        </label>
        <label className="text-sm text-[black]">
          Franja
          <select name="slotMinutes" defaultValue="15"
            className="mt-1 block rounded-md border px-2 py-1">
            {SLOT_OPTIONS.map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-[black]">
          Pedidos por franja
          <input name="maxOrdersPerSlot" type="number" min={1} max={50} defaultValue={5} required
            className="mt-1 block w-24 rounded-md border px-2 py-1" />
        </label>
        <button type="submit" disabled={pending}
          className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
          {pending ? "Añadiendo..." : "Añadir tramo"}
        </button>
      </div>

      {(err.opensAt || err.closesAt || err.slotMinutes || err.maxOrdersPerSlot) && (
        <p className="text-sm text-red-600">
          {err.opensAt || err.closesAt || err.slotMinutes || err.maxOrdersPerSlot}
        </p>
      )}
    </form>
  );
}