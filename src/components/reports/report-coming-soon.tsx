import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Construction,
  FileText,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";

export function ReportComingSoon({
  title,
  description,
  features,
  icon,
}: {
  title: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-5xl items-center justify-center">
      <section className="relative w-full overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm sm:px-12">
        <div className="absolute -left-20 -top-24 size-64 rounded-full bg-green-100/70 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 size-64 rounded-full bg-amber-100/70 blur-3xl" />

        <div className="relative">
          <SchoolLogo
            size="lg"
            showName={false}
            href={null}
            priority
          />

          <div className="mx-auto mt-8 flex size-16 items-center justify-center rounded-2xl bg-green-700 text-white shadow-lg shadow-green-700/20">
            {icon}
          </div>

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
            <Construction className="size-4" />
            Coming Soon
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
            {title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
            {description}
          </p>

          <div className="mx-auto mt-9 grid max-w-3xl gap-4 text-left sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <FileText className="size-4" />
                </div>

                <p className="pt-1 text-sm font-semibold leading-6 text-slate-700">
                  {feature}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <Clock3 className="size-4 shrink-0" />
            This report will be added in a future release.
          </div>

          <Link
            href="/reports"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            <ArrowLeft className="size-4" />
            Return to Reports
          </Link>
        </div>
      </section>
    </div>
  );
}
