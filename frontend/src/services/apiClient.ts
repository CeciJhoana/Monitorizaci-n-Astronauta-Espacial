/**
 * Cliente HTTP mínimo para hablar con el backend.
 *
 * Todas las rutas son relativas a `API_BASE_URL`, que puede ser una URL
 * absoluta o `/api` (el proxy de Vite la reenvía al backend en desarrollo).
 */

import { API_BASE_URL } from "@/config/env";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor de la misión.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, `La API respondió con el estado ${response.status}.`);
  }
  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
};
