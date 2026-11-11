import { API_BASE_URL } from "@/lib/config";
import { ApiError, type ProblemDetail } from "./errors";
import type { paths } from "@/types/api.generated";

type RoutePath<T extends string> = T extends `${infer Head}{${string}}${infer Tail}`
  ? `${Head}${string}${RoutePath<Tail>}` : T;
type ApiPath = { [K in keyof paths]: K extends `/api/v1${infer Path}` ? RoutePath<Path> : never }[keyof paths];

let inMemoryAccessToken: string | null = null;
let sessionGeneration = 0;
export function getAccessToken(): string | null { return inMemoryAccessToken; }
export function setAccessToken(token: string | null): void {
  if (token === null) sessionGeneration += 1;
  inMemoryAccessToken = token;
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
  _retry?: boolean;
}

async function responseError(response: Response): Promise<ApiError> {
  const body: Partial<ProblemDetail> = await response.json().catch(() => ({}));
  return new ApiError({
    ...body,
    status: response.status,
    title: body.title || "Erro na requisição",
    detail: body.detail || response.statusText || "Não foi possível comunicar com o servidor.",
    errors: body.errors || [],
  });
}

async function fetchApi(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (error) {
    if (init.signal?.aborted) throw error;
    throw new ApiError({ status: 0, title: "Erro de conexão", detail: "Não foi possível conectar ao servidor. Tente novamente." });
  }
}

function redirectToLogin(): void {
  setAccessToken(null);
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    const generation = sessionGeneration;
    refreshPromise = (async () => {
      const response = await fetchApi("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        if (response.status === 401) redirectToLogin();
        throw await responseError(response);
      }
      const data: { accessToken?: string } = await response.json();
      if (!data.accessToken) throw new ApiError({
        status: 502, title: "Sessão inválida", detail: "O servidor não retornou um token de acesso.",
      });
      if (generation !== sessionGeneration) throw new ApiError({
        status: 401, title: "Sessão encerrada", detail: "A sessão foi encerrada durante a renovação.",
      });
      setAccessToken(data.accessToken);
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/** Chamadas privadas usam o access token em memória, recuperado do cookie httpOnly pelo BFF. */
export async function apiFetch<T>(path: ApiPath, options: RequestOptions = {}): Promise<T> {
  const { params, _retry, ...fetchInit } = options;
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const isPublicAuth = path.startsWith("/auth/");
  if (!isPublicAuth && !getAccessToken() && typeof window !== "undefined") await refreshAccessToken();

  const headers = new Headers(fetchInit.headers);
  headers.set("Accept", "application/json");
  if (fetchInit.body && !headers.has("Content-Type") && !(fetchInit.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (!isPublicAuth && token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetchApi(url, { ...fetchInit, headers, cache: "no-store" });
  if (response.status === 401 && !isPublicAuth && typeof window !== "undefined") {
    if (!_retry) {
      if (token === getAccessToken() || !getAccessToken()) await refreshAccessToken();
      return apiFetch<T>(path, { ...options, _retry: true });
    }
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    redirectToLogin();
  }
  if (!response.ok) throw await responseError(response);

  // O Spring também retorna 200/201 sem corpo em algumas mutações.
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

