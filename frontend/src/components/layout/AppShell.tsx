import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Topbar />
      <Sidebar />
      <main className="lg:pl-[220px]">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}

