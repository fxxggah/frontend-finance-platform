/**
 * Fuso horário padrão da aplicação.
 */
export const TIMEZONE = "America/Sao_Paulo";

/**
 * Data determinística de referência da aplicação (31 de outubro de 2026).
 */
export const TODAY = "2026-10-31";

/**
 * Converte de forma segura uma string 'YYYY-MM-DD' ou objeto Date para Date
 * fixando ao meio-dia para evitar deslocamento de fuso horário (-3h UTC).
 */
export function parseDateSafe(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  // Se estiver no formato YYYY-MM-DD simples, acrescenta horário do meio-dia local
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00`);
  }

  return new Date(value);
}

/**
 * Formata para data curta: "31/10"
 * @example formatShortDate("2026-10-31") => "31/10"
 */
export function formatShortDate(value: string | Date): string {
  const date = parseDateSafe(value);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

/**
 * Formata para data extensa curta: "31 de out."
 * @example formatLongDate("2026-10-31") => "31 de out."
 */
export function formatLongDate(value: string | Date): string {
  const date = parseDateSafe(value);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "short",
  })
    .format(date)
    .replace(".", "");
}

/**
 * Formata para Mês/Ano: "out/2026"
 * @example formatMonthYear("2026-10-31") => "out/2026"
 */
export function formatMonthYear(value: string | Date): string {
  const date = parseDateSafe(value);
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    month: "short",
    year: "numeric",
  }).formatToParts(date);

  const month = parts.find((p) => p.type === "month")?.value.replace(".", "") ?? "";
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  return `${month}/${year}`;
}

/**
 * Formata para data completa padrão: "31/10/2026"
 * @example formatDate("2026-10-31") => "31/10/2026"
 */
export function formatDate(value: string | Date): string {
  const date = parseDateSafe(value);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Alias para data completa: "31/10/2026"
 */
export const formatFullDate = formatDate;

/**
 * Formata referência de competência de fatura: "2026-10"
 */
export function formatInvoiceReference(value: string | Date): string {
  const date = parseDateSafe(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

