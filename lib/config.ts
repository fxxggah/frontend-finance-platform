/**
 * Configuração central da aplicação FIN.
 */

// Flag central de alternância entre mocks e backend real.
// Somente o valor literal "true" habilita mocks; ausente ou "false" usa a API real.
export const USE_MOCK: boolean = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// URL base da API REST backend (Spring Boot)
const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(/\/+$/, "");
export const API_BASE_URL: string = rawApiUrl.endsWith("/api/v1")
  ? rawApiUrl
  : `${rawApiUrl}/api/v1`;

/**
 * Simula a latência de rede realista para o modo de desenvolvimento com mocks (300ms a 600ms).
 */
export async function simulateNetworkDelay(minMs = 300, maxMs = 600): Promise<void> {
  if (!USE_MOCK) return;
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
