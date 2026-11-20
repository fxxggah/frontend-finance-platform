import { API_BASE_URL, USE_MOCK } from "@/lib/config";
import { ApiError, parseRetryAfter, type ProblemDetail } from "./errors";
import type { paths } from "@/types/api.generated";

type RoutePath<T extends string> = T extends `${infer Head}{${string}}${infer Tail}`
  ? `${Head}${string}${RoutePath<Tail>}` : T;
type ApiPath = { [K in keyof paths]: K extends `/api/v1${infer Path}` ? RoutePath<Path> : never }[keyof paths];

const SESSION_EPOCH_KEY = "fin:session-epoch";
const SESSION_CHANGED_EVENT = "fin:session-changed";
export const SESSION_CHANGED = "SESSION_CHANGED";

let inMemoryAccessToken: string | null = null;
let sessionGeneration = 0;
let observedEpoch: string | null | undefined;
let sessionChanged = false;
let sessionRequests = new AbortController();

function readEpoch(): string | null {
  try { return typeof window === "undefined" ? null : window.localStorage?.getItem(SESSION_EPOCH_KEY) ?? null; }
  catch { return null; }
}

function markSessionChanged(): void {
  if (sessionChanged) return;
  sessionChanged = true;
  setAccessToken(null);
  if (typeof window !== "undefined") window.dispatchEvent?.(new Event(SESSION_CHANGED_EVENT));
}

function assertSessionEpoch(): void {
  const current = readEpoch();
  if (observedEpoch === undefined) observedEpoch = current;
  if (observedEpoch !== current) markSessionChanged();
  if (sessionChanged) throw new ApiError({
    status: 401, code: SESSION_CHANGED, title: "Sessão alterada",
    detail: "A sessão mudou em outra aba. Confira antes de continuar.",
  });
}

export function onSessionChanged(listener: () => void): () => void {
  function onStorage(event: StorageEvent) {
    if ((event.key === SESSION_EPOCH_KEY || event.key === null) && observedEpoch !== readEpoch()) markSessionChanged();
  }
  window.addEventListener(SESSION_CHANGED_EVENT, listener);
  window.addEventListener("storage", onStorage);
  try { assertSessionEpoch(); } catch { listener(); }
  return () => {
    window.removeEventListener(SESSION_CHANGED_EVENT, listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Chamar dentro do Web Lock, depois de o servidor atualizar o cookie. */
export function publishSessionCookieChange(): void {
  try { window.localStorage?.setItem(SESSION_EPOCH_KEY, crypto.randomUUID()); }
  catch { /* A comparação do subject continua protegendo a renovação. */ }
  observedEpoch = readEpoch();
  sessionGeneration += 1;
}

export function getAccessToken(): string | null { return inMemoryAccessToken; }
export function setAccessToken(token: string | null): void {
  if (token === null) {
    sessionGeneration += 1;
    sessionRequests.abort();
    sessionRequests = new AbortController();
  }
  if (observedEpoch === undefined) observedEpoch = readEpoch();
  inMemoryAccessToken = token;
}

function tokenSubject(token: string | null): string | null {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const { sub } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof sub === "string" && sub ? sub : null;
  } catch { return null; }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined | null>;
}

async function responseError(response: Response): Promise<ApiError> {
  const body: Partial<ProblemDetail> = await response.json().catch(() => ({}));
  return new ApiError({
    ...body,
    status: response.status,
    title: body.title || "Erro na requisição",
    detail: body.detail || response.statusText || "Não foi possível comunicar com o servidor.",
    errors: body.errors || [],
    retryAfterSeconds: parseRetryAfter(response.headers.get("Retry-After")),
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

export const SESSION_REAUTH_REQUIRED = "SESSION_REAUTH_REQUIRED";

export async function withSessionCookieLock<T>(action: () => Promise<T>, refreshing = false): Promise<T> {
  const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
  if (locks) return locks.request("fin:auth-session", { mode: "exclusive" }, action);
  if (refreshing && !USE_MOCK) throw new ApiError({
    status: 401,
    code: SESSION_REAUTH_REQUIRED,
    title: "Entre novamente",
    detail: "Este navegador não consegue renovar a sua sessão com segurança.",
  });
  return action();
}

function checkSessionGeneration(generation: number): void {
  assertSessionEpoch();
  if (generation !== sessionGeneration) throw new ApiError({
    status: 401, title: "Sessão encerrada", detail: "A sessão foi encerrada durante a renovação.",
  });
}

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    const generation = sessionGeneration;
    refreshPromise = withSessionCookieLock(async () => {
      checkSessionGeneration(generation);
      const subject = tokenSubject(getAccessToken());
      const response = await fetchApi("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      checkSessionGeneration(generation);
      if (!response.ok) {
        throw await responseError(response);
      }
      const data: unknown = await response.json().catch(() => null);
      if (!data || typeof data !== "object" || !("accessToken" in data) ||
          typeof data.accessToken !== "string" || !data.accessToken.trim()) throw new ApiError({
        status: 502, title: "Sessão inválida", detail: "O servidor não retornou um token de acesso.",
      });
      checkSessionGeneration(generation);
      if (subject !== null && tokenSubject(data.accessToken) !== subject) {
        markSessionChanged();
        assertSessionEpoch();
      }
      setAccessToken(data.accessToken);
    }, true).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/** Recupera a sessão sem navegar; a barreira inicial decide como tratar o resultado. */
export async function ensureAccessToken(): Promise<void> {
  assertSessionEpoch();
  if (!getAccessToken()) await refreshAccessToken();
}

async function refreshForRequest(): Promise<void> {
  try {
    await refreshAccessToken();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !sessionChanged) redirectToLogin();
    throw error;
  }
}

export async function endSession(): Promise<void> {
  assertSessionEpoch();
  setAccessToken(null);
  const generation = sessionGeneration;
  await withSessionCookieLock(async () => {
    // Um logout enfileirado não pode revogar o cookie instalado por outra aba.
    checkSessionGeneration(generation);
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) throw new Error("Não foi possível encerrar a sessão.");
    publishSessionCookieChange();
  });
}

/** Chamadas privadas ficam vinculadas à sessão que as iniciou. */
export async function apiFetch<T>(path: ApiPath, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchInit } = options;
  const url = new URL(API_BASE_URL + path);
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  });

  const isPublicAuth = path.startsWith("/auth/");
  const protectedBrowserRequest = !isPublicAuth && typeof window !== "undefined";
  const generation = sessionGeneration;
  const checkSession = () => {
    if (protectedBrowserRequest) checkSessionGeneration(generation);
  };
  checkSession();
  if (protectedBrowserRequest && !getAccessToken()) await refreshForRequest();

  const headers = new Headers(fetchInit.headers);
  headers.set("Accept", "application/json");
  if (fetchInit.body && !headers.has("Content-Type") && !(fetchInit.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const send = async (token: string | null) => {
    checkSession();
    if (!isPublicAuth && token) headers.set("Authorization", "Bearer " + token);
    const signal = protectedBrowserRequest
      ? (fetchInit.signal && AbortSignal.any
        ? AbortSignal.any([fetchInit.signal, sessionRequests.signal])
        : fetchInit.signal ?? sessionRequests.signal)
      : fetchInit.signal;
    try {
      return await fetchApi(url, { ...fetchInit, headers, cache: "no-store", signal });
    } finally {
      checkSession();
    }
  };

  const token = getAccessToken();
  let response = await send(token);
  if (response.status === 401 && protectedBrowserRequest) {
    if (token === getAccessToken() || !getAccessToken()) await refreshForRequest();
    response = await send(getAccessToken());
    if (response.status === 401) {
      await endSession().catch(() => undefined);
      if (!sessionChanged) redirectToLogin();
    }
  }
  if (!response.ok) {
    const error = await responseError(response);
    if (response.status !== 401 || !protectedBrowserRequest || sessionChanged) checkSession();
    throw error;
  }

  const body = await response.text();
  checkSession();
  return body ? JSON.parse(body) as T : undefined as T;
}
