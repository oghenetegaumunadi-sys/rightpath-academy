import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  accent?: "green" | "amber";
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  accent = "green",
}: StatCardProps) {
  const styles =
    accent === "amber"
      ? {
          icon: "bg-amber-100 text-amber-700",
          badge: "bg-amber-50 text-amber-700",
        }
      : {
          icon: "bg-green-100 text-green-700",
          badge: "bg-green-50 text-green-700",
        };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex size-12 items-center justify-center rounded-xl ${styles.icon}`}
        >
          <Icon className="size-6" />
        </div>
      </div>

      <div
        className={`mt-5 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}
      >
        {description}
      </div>
    </article>
  );
}
