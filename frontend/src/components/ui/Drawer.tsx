import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number;
}

export function Drawer({ open, onClose, title, children, width = 420 }: DrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="absolute inset-0 bg-zinc-950/30"
            onClick={onClose}
          />
          <motion.div
            className="absolute right-0 top-0 h-full surface border-l overflow-y-auto"
            style={{ width }}
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {title ? (
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <h3 className="text-section font-medium">{title}</h3>
                <button
                  onClick={onClose}
                  className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  <X size={16} />
                </button>
              </div>
            ) : null}
            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
