import type { ReactNode } from "react";

type Tone =
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "neutral";

const tones: Record<Tone, string> = {
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-700",
  neutral: "bg-slate-100 text-slate-700",
};

export function StatCard({
  label,
  value,
  description,
  icon,
  tone = "green",
  trend,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  tone?: Tone;
  trend?: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          {description ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {description}
            </p>
          ) : null}

          {trend ? (
            <div className="mt-3 text-xs font-semibold text-green-700">
              {trend}
            </div>
          ) : null}
        </div>

        {icon ? (
          <div
            className={[
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              tones[tone],
            ].join(" ")}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  );
}
