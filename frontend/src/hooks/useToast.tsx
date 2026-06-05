import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createId } from "@/lib/utils";

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastItem["type"], duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const value = useMemo(
    () => ({
      toasts,
      addToast: (message: string, type: ToastItem["type"] = "info", duration = 4000) => {
        const id = createId("toast");
        setToasts((current) => [...current, { id, message, type, duration }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, duration);
      },
      removeToast: (id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      },
    }),
    [toasts],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
