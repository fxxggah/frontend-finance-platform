export interface ValidationError {
  field: string;
  message: string;
}

export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: ValidationError[];
  code?: string;
  retryAfterSeconds?: number;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly detail: string;
  public readonly errors: ValidationError[];
  public readonly type?: string;
  public readonly instance?: string;
  public readonly code?: string;
  public readonly retryAfterSeconds?: number;

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.title = problem.title;
    this.detail = problem.detail;
    this.errors = problem.errors || [];
    this.type = problem.type;
    this.instance = problem.instance;
    this.code = typeof problem.code === "string" ? problem.code : undefined;
    this.retryAfterSeconds = problem.retryAfterSeconds;

    // Mantém compatibilidade adequada da cadeia de protótipos
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Retorna a mensagem de erro específica de validação de um campo (se existir).
   */
  getFieldError(fieldName: string): string | undefined {
    return this.errors.find((err) => err.field === fieldName)?.message;
  }
}


/** Retry-After em segundos ou data HTTP; não inicia repetição automaticamente. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = /^\d+$/.test(value.trim()) ? Number(value) : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.min(seconds, 7 * 24 * 60 * 60) : undefined;
}
