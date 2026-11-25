"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format";

export function CartBar({ slug, color }: { slug: string; color: string }) {
  const lines = useCart((s) => s.lines);
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * l.priceCents, 0);

  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 p-4">
      <Link
        href={`/${slug}/checkout`}
        style={{ backgroundColor: color }}
        className="mx-auto flex max-w-2xl items-center justify-between rounded-full px-5 py-3 font-medium text-white shadow-lg"
      >
        <span>
          Ver pedido · {count} {count === 1 ? "plato" : "platos"}
        </span>
        <span>{formatPrice(total)}</span>
      </Link>
    </div>
  );
}