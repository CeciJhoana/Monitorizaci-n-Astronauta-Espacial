/**
 * Cliente HTTP mínimo para hablar con los backends.
 *
 * Todas las rutas son relativas a una base URL, que puede ser una URL
 * absoluta o una ruta (el proxy de Vite la reenvía en desarrollo).
 * Por defecto se usa la base del backend de misión (`API_BASE_URL`).
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

async function request<T>(path: string, baseUrl: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
  } catch {
    throw new ApiError(0, "No se pudo conectar con el servidor.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, `La API respondió con el estado ${response.status}.`);
  }
  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, baseUrl: string = API_BASE_URL) => request<T>(path, baseUrl),
  post: <T>(path: string, body: unknown, baseUrl: string = API_BASE_URL) =>
    request<T>(path, baseUrl, { method: "POST", body: JSON.stringify(body) }),
};
