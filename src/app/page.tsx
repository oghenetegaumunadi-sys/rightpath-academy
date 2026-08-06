import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";

const features = [
  {
    title: "Student Management",
    description:
      "Manage admissions, student profiles, classes and academic records from one place.",
    icon: Users,
  },
  {
    title: "Daily Attendance",
    description:
      "Record attendance, identify absences and monitor school-wide participation.",
    icon: CalendarCheck,
  },
  {
    title: "Academic Results",
    description:
      "Enter scores, review submissions, publish results and produce report cards.",
    icon: BookOpen,
  },
  {
    title: "Fees and Payments",
    description:
      "Track fees, payments, balances and receipts with clear financial records.",
    icon: WalletCards,
  },
  {
    title: "School Analytics",
    description:
      "Understand enrollment, attendance, results and operational performance.",
    icon: BarChart3,
  },
  {
    title: "Secure Access",
    description:
      "Give principals, teachers, staff and parents access to the right tools.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <SchoolLogo
            size="md"
            href="/"
            priority
          />

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
            <a
              href="#features"
              className="transition hover:text-green-700"
            >
              Features
            </a>

            <a
              href="#about"
              className="transition hover:text-green-700"
            >
              About
            </a>
          </nav>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-800"
          >
            School Portal
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,107,62,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_38%)]" />

        <div className="relative mx-auto grid min-h-[690px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
              <ShieldCheck className="size-4" />
              Smarter school administration
            </div>

            <h1 className="mt-7 max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
              Building brighter futures through{" "}
              <span className="text-green-700">
                better school management.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              A secure platform for managing students,
              teachers, attendance, academic results,
              report cards and everyday school operations.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3.5 font-bold text-white shadow-lg shadow-green-700/20 transition hover:bg-green-800"
              >
                Sign in to the portal
                <ArrowRight className="size-5" />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-6 py-3.5 font-bold text-green-800 transition hover:bg-green-50"
              >
                Explore features
              </a>
            </div>

            <div className="mt-10 grid max-w-xl gap-3 text-sm font-medium text-slate-600 sm:grid-cols-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                Secure role-based access
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                Complete academic workflow
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                Attendance and reports
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                Mobile-friendly dashboard
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 size-36 rounded-full bg-amber-200/50 blur-3xl" />
            <div className="absolute -bottom-10 -right-8 size-44 rounded-full bg-green-200/60 blur-3xl" />

            <div className="relative rounded-[2rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-green-950/10">
              <div className="rounded-[1.5rem] bg-[#075a36] p-6 text-white sm:p-8">
                <div className="flex items-center justify-between">
                  <SchoolLogo
                    size="sm"
                    inverse
                    href={null}
                  />

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-green-100">
                    Live overview
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-sm font-semibold text-green-100">
                    Welcome back
                  </p>

                  <h2 className="mt-1 text-3xl font-bold">
                    School Overview
                  </h2>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <OverviewCard
                    label="Students"
                    value="1,248"
                  />

                  <OverviewCard
                    label="Teachers"
                    value="67"
                    accent
                  />

                  <OverviewCard
                    label="Attendance"
                    value="94%"
                  />

                  <OverviewCard
                    label="Classes"
                    value="24"
                  />
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-500">
                    Academic performance
                  </p>

                  <p className="mt-2 text-3xl font-bold text-green-700">
                    82.4%
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Average result this term
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-800">
                    One connected platform
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    Students, staff, attendance and results
                    working together.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-y border-slate-200 bg-slate-50 py-24"
      >
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-700">
              Core features
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight">
              Everything the school needs in one place
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Built to reduce manual work and give school
              leadership a clear view of daily operations.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <Icon className="size-6" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        id="about"
        className="py-24"
      >
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-600">
            Built for RightPath Academy
          </p>

          <h2 className="mt-4 text-4xl font-bold">
            A dependable foundation for digital school
            management
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            The platform brings academic and administrative
            operations together while giving each user access
            only to the information and tools they need.
          </p>

          <Link
            href="/login"
            className="mt-9 inline-flex items-center gap-2 rounded-xl bg-green-700 px-7 py-3.5 font-bold text-white transition hover:bg-green-800"
          >
            Enter the school portal
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-[#043d22] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <SchoolLogo
            size="sm"
            inverse
            href="/"
          />

          <p className="text-sm text-green-100">
            School Management System · Powered by Kosta
            Technologies
          </p>
        </div>
      </footer>
    </main>
  );
}

function OverviewCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl p-5",
        accent
          ? "bg-amber-400 text-slate-950"
          : "bg-white/10 text-white",
      ].join(" ")}
    >
      <p className="text-3xl font-bold">
        {value}
      </p>

      <p
        className={[
          "mt-2 text-sm",
          accent
            ? "text-slate-800"
            : "text-green-100",
        ].join(" ")}
      >
        {label}
      </p>
    </div>
  );
}
