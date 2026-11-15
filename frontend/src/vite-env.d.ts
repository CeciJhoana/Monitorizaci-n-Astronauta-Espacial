/// <reference types="vite/client" />

/** Variables de entorno soportadas por la aplicación. */
interface ImportMetaEnv {
  /** Base URL de la API. Vacía → modo demostración con datos simulados. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
