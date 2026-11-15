/**
 * Base de datos simulada de Órbita.
 *
 * Réplica en memoria del esquema `docs/esquema-base-datos.sql`. Expone las
 * tablas con el mismo nombre que en SQL y los selectores que las convierten
 * en las formas que consume la interfaz.
 *
 * Uso típico:
 *
 * ```ts
 * import { MOCK_DB, buildMissionSnapshot } from "@/data/db";
 *
 * const snapshot = buildMissionSnapshot(MOCK_DB);
 * ```
 */

import { createMockDatabase } from "./seed";
import type { MockDatabase } from "./schema";

/**
 * Instancia única de la base de datos simulada. Se crea una sola vez al
 * importar el módulo para que todas las vistas compartan las mismas filas.
 */
export const MOCK_DB: MockDatabase = createMockDatabase();

export { createMockDatabase } from "./seed";
export { ID, MISSION_DAY, MISSION_TOTAL_DAYS } from "./seed";
export * from "./schema";
export * from "./selectors";
