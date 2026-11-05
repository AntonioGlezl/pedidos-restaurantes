"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

export function ClearCart() {
  useEffect(() => {
    Promise.resolve(useCart.persist.rehydrate()).then(() => {
      useCart.getState().clear();
    });
  }, []);

  return null;
}