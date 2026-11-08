export function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatQuantity(value: number | string | null | undefined, unit?: string) {
  const numeric = Number(value ?? 0);
  const text = numeric.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
  return unit ? `${text} ${unit}` : text;
}

export function formatDate(value?: string) {
  if (!value) return "-";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    if (!isValidIsoDate(value)) return "-";
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
}

// Formulários aceitam vírgula ou ponto decimal, sem converter formatos como 1e3 ou 0xFF.
export function parseDecimalInput(value: string, fractionDigits = 3) {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return 0;
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0) return Number.NaN;

  const decimalPattern = fractionDigits === 0
    ? /^-?\d+$/
    : new RegExp(`^-?\\d+(?:\\.\\d{1,${fractionDigits}})?$`);
  if (!decimalPattern.test(normalized)) return Number.NaN;

  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

export function todayIsoLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join("/");
}

export function parseDateInput(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return null;
  const [day, month, year] = value.split("/");
  const isoDate = `${year}-${month}-${day}`;
  return isValidIsoDate(isoDate) ? isoDate : null;
}

export function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
