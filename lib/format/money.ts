export const TABULAR_NUMS_CLASS = "tabular-nums";

const inputMoneyFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formats a value in reais, without the currency symbol. */
export function formatMoneyInput(value: number): string {
  return Number.isFinite(value) ? inputMoneyFormatter.format(value) : '';
}

/** Parses a complete pt-BR amount; empty or malformed input is invalid. */
export function parseMoneyInput(value: string): number {
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(value)) return NaN;
  return Number(value.replace(/\./g, '').replace(',', '.'));
}

/** Digits represent integer cents, never successive floating point additions. */
export function maskMoneyInput(value: string, allowNegative = false): string | null {
  if (!/^-?[\d.,]*$/.test(value) || (!allowNegative && value.startsWith('-'))) return null;
  const digits = value.replace(/\D/g, '');
  if (!digits) return allowNegative && value === '-' ? '-' : '';
  const cents = Number(digits);
  if (!Number.isSafeInteger(cents)) return null;
  const formatted = formatMoneyInput(cents / 100);
  if (Number(formatted.replace(/\D/g, '')) !== cents) return null;
  return `${value.startsWith('-') ? '-' : ''}${formatted}`;
}

/** Clipboard accepts raw cents or a complete Brazilian amount, optionally with R$. */
export function moneyPasteDigits(value: string, allowNegative = false): string | null {
  const text = value.trim().replace(/^(-?)\s*R\$\s*/, '$1');
  if (text.startsWith('-') && !allowNegative) return null;
  if (/^-?\d+$/.test(text)) return text;
  if (!/^-?(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,2})?$/.test(text)) return null;
  const [integer, fraction = '00'] = text.split(',');
  return integer.replace(/\./g, '') + fraction.padEnd(2, '0');
}

export interface FormatMoneyOptions {
  showSign?: boolean;
  signDisplay?: "always" | "auto" | "never";
}

/**
 * Formata um valor numérico para o padrão monetário BRL (pt-BR).
 * Utiliza o caractere tipográfico de menos '−' (U+2212) para valores negativos ou com sinal explícito.
 *
 * @example formatMoney(1234.56) => "R$ 1.234,56"
 * @example formatMoney(-1234.56) => "− R$ 1.234,56"
 * @example formatMoney(1234.56, { showSign: true }) => "+ R$ 1.234,56"
 */
export function formatMoney(value: number, options?: FormatMoneyOptions): string {
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));

  if (options?.signDisplay === "never") {
    return formatted;
  }

  if (options?.showSign || options?.signDisplay === "always") {
    if (value > 0) return `+ ${formatted}`;
    if (value < 0) return `− ${formatted}`;
    return formatted;
  }

  return value < 0 ? `− ${formatted}` : formatted;
}

/**
 * Formata valores monetários de forma compacta (ex: R$ 1,2 mil, R$ 2,5 mi).
 * Útil para eixos de gráficos, resumos e badges.
 *
 * @example formatCompactMoney(1200) => "R$ 1,2 mil"
 * @example formatCompactMoney(2500000) => "R$ 2,5 mi"
 * @example formatCompactMoney(500) => "R$ 500,00"
 */
export function formatCompactMoney(value: number): string {
  const abs = Math.abs(value);
  const prefix = value < 0 ? "− " : "";

  if (abs >= 1_000_000) {
    const formatted = (abs / 1_000_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    });
    return `${prefix}R$ ${formatted} mi`;
  }

  if (abs >= 1_000) {
    const formatted = (abs / 1_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
      minimumFractionDigits: 0,
    });
    return `${prefix}R$ ${formatted} mil`;
  }

  return formatMoney(value);
}

