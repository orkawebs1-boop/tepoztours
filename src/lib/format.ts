import type { Lang } from "./types";

export function priceTxt(price: number): string {
  return "$" + Math.round(price).toLocaleString("en-US");
}

export function durShort(hours: number): string {
  return `${formatHours(hours)} h`;
}

export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : String(hours).replace(/\.0+$/, "");
}

/** Solo dígitos. */
export function digits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Enlace de WhatsApp con mensaje predefinido.
 * Formato del handoff: https://wa.me/52{numero}?text={encodeURIComponent(mensaje)}
 */
export function waLink(whatsapp: string, message: string): string {
  const n = digits(whatsapp);
  const base = n.length === 10 ? `https://wa.me/52${n}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(message)}`;
}

/** "777 123 4567" para mostrar. */
export function prettyPhone(whatsapp: string): string {
  const n = digits(whatsapp);
  if (n.length !== 10) return "";
  return `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

/** Índice 0 → "01". */
export function numLabel(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export function tourHref(lang: Lang, slug: string): string {
  return `/${lang}/tours/${slug}`;
}
