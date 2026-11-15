/**
 * Variables de entorno de la aplicación.
 *
 * En modo demostración (sin `VITE_API_BASE_URL`) la app usa datos
 * simulados locales. Al definir la variable, todas las lecturas y
 * escrituras pasan por el backend.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const isApiConfigured = API_BASE_URL.length > 0;
