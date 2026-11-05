"use client";

import { useCart } from "@/lib/cart-store";

type Item = { id: string; name: string; priceCents: number };

export function AddToCart({ item, color }: { item: Item; color: string }) {
  const qty = useCart((s) => s.lines.find((l) => l.id === item.id)?.qty ?? 0);
  const add = useCart((s) => s.add);
  const decrease = useCart((s) => s.decrease);

  if (qty === 0) {
    return (
      <button
        onClick={() => add(item)}
        style={{ backgroundColor: color }}
        className="rounded-full px-4 py-1.5 text-sm font-medium text-white"
      >
        Añadir
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => decrease(item.id)}
        aria-label="Quitar uno"
        className="h-8 w-8 rounded-full border text-lg leading-none"
      >
        −
      </button>
      <span className="w-4 text-center font-medium">{qty}</span>
      <button
        onClick={() => add(item)}
        aria-label="Añadir uno"
        className="h-8 w-8 rounded-full border text-lg leading-none"
      >
        +
      </button>
    </div>
  );
}