import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            className={cn(
              "relative w-full max-w-[480px] rounded-modal surface shadow-none",
              className,
            )}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {title ? (
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3.5">
                <h3 className="text-section font-medium text-zinc-900 dark:text-zinc-100">{title}</h3>
                <button
                  onClick={onClose}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
            <div className="px-5 py-4">{children}</div>
            {footer ? (
              <div className="flex justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 px-5 py-3">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
