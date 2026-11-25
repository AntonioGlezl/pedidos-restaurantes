import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = { id: string; name: string; priceCents: number; qty: number };

export const MAX_QTY = 20;

type CartState = {
  slug: string | null;
  lines: CartLine[];
  setSlug: (slug: string) => void;
  add: (item: Omit<CartLine, "qty">) => void;
  decrease: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      slug: null,
      lines: [],
      setSlug: (slug) => set((s) => (s.slug === slug ? s : { slug, lines: [] })),
      add: (item) =>
        set((s) => {
          const exists = s.lines.some((l) => l.id === item.id);
          if (exists) {
            return {
              lines: s.lines.map((l) =>
                l.id === item.id ? { ...l, qty: Math.min(MAX_QTY, l.qty + 1) } : l
              ),
            };
          }
          return { lines: [...s.lines, { ...item, qty: 1 }] };
        }),
      decrease: (id) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
            .filter((l) => l.qty > 0),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    // skipHydration evita errores de hidratación: leemos localStorage a mano, ya en el navegador
    { name: "cart", skipHydration: true }
  )
);