import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, meta, actions }: PageHeaderProps) {
  return (
    <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-page font-medium text-zinc-900 dark:text-zinc-100">{title}</h1>
        {subtitle ? <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">{subtitle}</p> : null}
        {meta ? <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-zinc-500">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

