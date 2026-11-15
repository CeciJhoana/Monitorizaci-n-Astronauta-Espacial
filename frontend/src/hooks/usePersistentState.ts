import { useEffect, useState } from "react";

/**
 * Estado sincronizado con `localStorage`.
 *
 * Da persistencia local a los registros de la sesión (mediciones,
 * bitácora, preferencias), en línea con el requisito de operar sin
 * conexión. Si el almacenamiento no está disponible, degrada a estado
 * en memoria.
 */
type StateUpdater<T> = T | ((current: T) => T);

export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (update: StateUpdater<T>) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : (JSON.parse(stored) as T);
    } catch {
      return initialValue;
    }
  });

  const update = (next: StateUpdater<T>) =>
    setValue((current) =>
      typeof next === "function" ? (next as (current: T) => T)(current) : next,
    );

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Sin almacenamiento disponible (p. ej. modo privado estricto).
    }
  }, [key, value]);

  return [value, update];
}
