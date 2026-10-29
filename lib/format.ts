const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatPrice(cents: number) {
  return eur.format(cents / 100);
}

// 1250 -> "12,50" (para rellenar el input al editar)
export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}