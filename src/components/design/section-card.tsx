import type { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  icon,
  action,
  children,
  className = "",
  contentClassName = "",
}: {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section
      className={[
        "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {title || description || icon || action ? (
        <header className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            {icon ? (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                {icon}
              </div>
            ) : null}

            <div>
              {title ? (
                <h2 className="text-lg font-semibold text-slate-950">
                  {title}
                </h2>
              ) : null}

              {description ? (
                <p className="mt-1 text-sm text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {action}
        </header>
      ) : null}

      <div
        className={[
          "p-6",
          contentClassName,
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}
