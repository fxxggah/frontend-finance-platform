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
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly detail: string;
  public readonly errors: ValidationError[];
  public readonly type?: string;
  public readonly instance?: string;

  constructor(problem: ProblemDetail) {
    super(problem.detail || problem.title);
    this.name = "ApiError";
    this.status = problem.status;
    this.title = problem.title;
    this.detail = problem.detail;
    this.errors = problem.errors || [];
    this.type = problem.type;
    this.instance = problem.instance;

    // Mantém compatibilidade adequada da cadeia de protótipos
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Retorna a mensagem de erro específica de validação de um campo (se existir).
   */
  getFieldError(fieldName: string): string | undefined {
    return this.errors.find((err) => err.field === fieldName)?.message;
  }
}

