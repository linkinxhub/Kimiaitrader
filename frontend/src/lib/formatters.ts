interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  amount: number | null | undefined,
  {
    currency = "EUR",
    locale = "fr-FR",
    minimumFractionDigits,
    maximumFractionDigits,
  }: CurrencyFormatOptions = {},
) {
  if (amount == null || !Number.isFinite(amount)) return "Unavailable";

  const digits =
    minimumFractionDigits != null || maximumFractionDigits != null
      ? {
          minimumFractionDigits,
          maximumFractionDigits,
        }
      : Number.isInteger(amount)
        ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 };

  const value = new Intl.NumberFormat(locale, digits).format(amount);
  return `${value} ${currency === "EUR" ? "€" : currency}`;
}

export function formatCompactCurrency(amount: number | null | undefined, currency = "EUR", locale = "fr-FR") {
  if (amount == null || !Number.isFinite(amount)) return "Unavailable";

  const value = new Intl.NumberFormat(locale, {
    notation: "compact",
    compactDisplay: "short",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);

  return `${value} ${currency === "EUR" ? "€" : currency}`;
}

export function formatMarketPrice(value: number | null | undefined, code: string) {
  if (value == null || !Number.isFinite(value)) return "Unavailable";

  const usesFourDigits =
    code.includes("/") || code === "BTC" || code === "ETH" || code === "SOL" || code === "BNB";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: usesFourDigits ? 4 : 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, maximumFractionDigits = 2) {
  if (value == null || !Number.isFinite(value)) return "Unavailable";
  return `${value >= 0 ? "+" : ""}${value.toFixed(maximumFractionDigits)}%`;
}

export function formatTimestamp(value: string | null | undefined, locale = "en-GB") {
  if (!value) return "Unavailable";

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}
