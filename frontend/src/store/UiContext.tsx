import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { ModalRequest, PageId } from "@/types";

interface UiValue {
  page: PageId;
  navigate: (page: PageId) => void;
  activeModal: ModalRequest | null;
  openModal: (request: ModalRequest) => void;
  closeModal: () => void;
}

const UiContext = createContext<UiValue | null>(null);

export function useUi(): UiValue {
  const context = useContext(UiContext);
  if (!context) throw new Error("useUi debe usarse dentro de <UiProvider>.");
  return context;
}

/** Estado de interfaz global: página activa y ventana modal abierta. */
export function UiProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<PageId>("dashboard");
  const [activeModal, setActiveModal] = useState<ModalRequest | null>(null);

  const navigate = useCallback((nextPage: PageId) => setPage(nextPage), []);
  const openModal = useCallback((request: ModalRequest) => setActiveModal(request), []);
  const closeModal = useCallback(() => setActiveModal(null), []);

  return (
    <UiContext.Provider value={{ page, navigate, activeModal, openModal, closeModal }}>
      {children}
    </UiContext.Provider>
  );
}
