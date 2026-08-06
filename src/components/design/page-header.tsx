import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-4">
        {icon ? (
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white shadow-sm">
            {icon}
          </div>
        ) : null}

        <div>
          {eyebrow ? (
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-green-700">
              {eyebrow}
            </p>
          ) : null}

          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>

          {description ? (
            <p className="mt-2 max-w-3xl leading-7 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          {actions}
        </div>
      ) : null}
    </section>
  );
}
