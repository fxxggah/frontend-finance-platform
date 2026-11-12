/** Converte uma data de referência para o valor ISO do input de semana. */
export function formatWeekInput(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const year = date.getUTCFullYear();
  const start = new Date(0);
  start.setUTCFullYear(year, 0, 1);
  start.setUTCHours(0, 0, 0, 0);
  const week = Math.ceil(((date.getTime() - start.getTime()) / 86400000 + 1) / 7);
  return `${String(year).padStart(4, '0')}-W${String(week).padStart(2, '0')}`;
}

/** Serializa a semana escolhida como uma data de referência para a API. */
export function weekInputToDate(value: string): string | null {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const week = Number(match[2]);
  if (year < 1 || week < 1 || week > 53) return null;
  const date = new Date(0);
  date.setUTCFullYear(year, 0, 4);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() || 7) + 1 + (week - 1) * 7);
  const reference = date.toISOString().slice(0, 10);
  return formatWeekInput(reference) === value ? reference : null;
}
