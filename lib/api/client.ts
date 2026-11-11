import { API_BASE_URL } from "@/lib/config";
import { ApiError, type ProblemDetail } from "./errors";

// Armazenamento em memória do token de acesso (volátil, seguro contra XSS)
let inMemoryAccessToken: string | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  _retry?: boolean;
}

/**
 * Constrói URL completa com path e query parameters sanitizados.
 */
function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined | null>): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch("/api/auth/refresh", { method: "POST" });
        if (!response.ok) return false;
        const data: { accessToken?: string } = await response.json();
        if (!data.accessToken) return false;
        setAccessToken(data.accessToken);
        return true;
      } catch {
        return false;
      }
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/**
 * Cliente HTTP desacoplado para comunicação com a API REST do FIN.
 */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { params, _retry, ...fetchInit } = options;
  const fullUrl = buildUrl(path, params);

  const headers = new Headers(fetchInit.headers);
  if (!headers.has("Content-Type") && !(fetchInit.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const isPublicAuth = path === "/auth/google";
  if (!isPublicAuth && !getAccessToken() && typeof window !== "undefined") {
    await attemptTokenRefresh();
  }
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(fullUrl, {
    ...fetchInit,
    headers,
    credentials: "include",
  });

  // Intercepta 401 para tentativa única de refresh
  if (response.status === 401 && !_retry && !isPublicAuth && typeof window !== "undefined") {
    // Uma resposta 401 pode vir de um token antigo enviado em paralelo.
    if (token !== getAccessToken() && getAccessToken()) {
      return apiFetch<T>(path, { ...options, _retry: true });
    }
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retry: true });
    }
    setAccessToken(null);
    if (window.location.pathname !== "/login") window.location.assign("/login");
  }

  // Tratamento de erros estruturados (RFC 7807)
  if (!response.ok) {
    let problem: ProblemDetail;
    try {
      const errorJson = await response.json();
      problem = {
        title: errorJson.title || "Erro na requisição",
        status: errorJson.status || response.status,
        detail: errorJson.detail || errorJson.message || response.statusText,
        type: errorJson.type,
        instance: errorJson.instance,
        errors: errorJson.errors || [],
      };
    } catch {
      problem = {
        title: "Erro de comunicação",
        status: response.status,
        detail: response.statusText || `Falha na requisição HTTP (${response.status})`,
      };
    }

    throw new ApiError(problem);
  }

  // Se resposta sem conteúdo (ex: 204 No Content)
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as unknown as T;
  }

  return (await response.json()) as T;
}

