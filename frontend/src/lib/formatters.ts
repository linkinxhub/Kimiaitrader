export function formatCurrency(
  value: number | null,
  options: Intl.NumberFormatOptions = {},
  locale = "fr-FR",
) {
  if (value == null || Number.isNaN(value)) {
    return "Unavailable";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

export function formatCompactCurrency(value: number | null, locale = "fr-FR") {
  if (value == null || Number.isNaN(value)) {
    return "Unavailable";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "Unavailable";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatMarketPrice(value: number | null, code?: string) {
  if (value == null || Number.isNaN(value)) {
    return "Unavailable";
  }

  const maximumFractionDigits = code === "BTC" || code === "ETH" || code === "SOL" || code === "BNB" ? 2 : value > 100 ? 2 : 4;

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

export function formatTimestamp(value: string | null) {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
}
