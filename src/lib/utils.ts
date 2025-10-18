import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formata valor monetário com ponto como separador decimal
export function formatCurrencyDot(value: number | string, currency: string = 'R$') {
  const n = typeof value === 'number' ? value : Number(value);
  const safe = Number.isFinite(n) ? n : 0;
  return `${currency} ${safe.toFixed(2)}`;
}
