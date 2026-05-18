import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  PackageSearch,
  Truck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const sections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "overview",
    items: [{ label: "Dashboard", to: "/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "inventory",
    items: [
      { label: "Products", to: "/products", icon: PackageSearch },
      { label: "Stock transactions", to: "/stock", icon: Boxes },
      { label: "Suppliers", to: "/suppliers", icon: Truck },
      { label: "Reports", to: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "devops",
    items: [{ label: "System status", to: "/devops", icon: Activity }],
  },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-14 z-20 hidden h-[calc(100vh-56px)] w-[220px] border-r border-zinc-200 bg-white px-3 py-4 dark:border-zinc-800 dark:bg-zinc-950 lg:block">
      <nav className="space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-2 text-[10px] font-medium tracking-[0.08em] text-zinc-400">{section.label}</p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex h-9 items-center gap-2 rounded px-2 text-[14px] transition-colors duration-micro",
                      "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100",
                      isActive && "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
                    )
                  }
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="absolute bottom-4 left-3 right-3 rounded-card border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-[12px] text-zinc-500">
          <FileText size={14} />
          API docs at <span className="font-mono">/docs</span>
        </div>
      </div>
    </aside>
  );
}

