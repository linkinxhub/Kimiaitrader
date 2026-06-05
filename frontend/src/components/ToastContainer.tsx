import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

const toneClasses = {
  success: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  error: "border-red-400/30 bg-red-500/15 text-red-100",
  warning: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  info: "border-blue-400/30 bg-blue-500/15 text-blue-100",
};

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            initial={{ opacity: 0, y: -16, x: 16 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -10, x: 10 }}
            onClick={() => removeToast(toast.id)}
            className={cn("rounded-2xl border px-4 py-3 text-left text-sm shadow-lg backdrop-blur", toneClasses[toast.type])}
          >
            {toast.message}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
