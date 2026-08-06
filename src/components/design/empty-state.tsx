import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      {icon ? (
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          {icon}
        </div>
      ) : null}

      <h2 className="mt-5 text-lg font-semibold text-slate-950">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action ? (
        <div className="mt-6 flex justify-center">
          {action}
        </div>
      ) : null}
    </div>
  );
}
