import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui/Icon";

const TOAST_DURATION_MS = 4500;

interface ToastValue {
  /** Muestra un aviso temporal en la parte inferior de la pantalla. */
  notify: (message: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export function useToast(): ToastValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const timerRef = useRef<number | null>(null);

  const notify = useCallback((nextMessage: string) => {
    setMessage(nextMessage);
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMessage(""), TOAST_DURATION_MS);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      {message && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {message}
          <button aria-label="Cerrar aviso" onClick={() => setMessage("")}>
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
