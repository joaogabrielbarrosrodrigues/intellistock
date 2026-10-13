export function formatCurrency(value: number | string | null | undefined) {
  const numeric = Number(value ?? 0);
  return numeric.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatQuantity(value: number | string | null | undefined, unit?: string) {
  const numeric = Number(value ?? 0);
  const text = numeric.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return unit ? `${text} ${unit}` : text;
}

export function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}
