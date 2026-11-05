const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatPrice(cents: number) {
  return eur.format(cents / 100);
}

// 1250 -> "12,50" (para rellenar el input al editar)
export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function formatDateLabel(dateStr: string) {
  // "2026-11-03" -> "mar, 3 nov"
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

export function formatPickup(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(date);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(date);
}

export function formatLongDate(dateStr: string) {
  // "2026-11-09" -> "lunes, 9 de noviembre"
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateStr}T00:00:00Z`));
}