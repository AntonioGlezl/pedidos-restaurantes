"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

export function CartInit({ slug }: { slug: string }) {
  useEffect(() => {
    Promise.resolve(useCart.persist.rehydrate()).then(() => {
      useCart.getState().setSlug(slug);
    });
  }, [slug]);

  return null;
}