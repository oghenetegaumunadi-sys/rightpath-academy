import type { Metadata } from "next";
import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ShieldCheck,
  Users,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";

import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

const benefits = [
  {
    label: "Student and staff records",
    icon: Users,
  },
  {
    label: "Daily attendance",
    icon: CalendarCheck,
  },
  {
    label: "Results and report cards",
    icon: BookOpenCheck,
  },
  {
    label: "School analytics",
    icon: BarChart3,
  },
];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen overflow-hidden bg-white">
      <section className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#075a36] p-12 text-white lg:flex">
        <div className="absolute -left-24 top-1/3 size-72 rounded-full border border-white/10" />
        <div className="absolute -right-20 bottom-10 size-80 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative">
          <SchoolLogo
            size="lg"
            inverse
            href="/"
            priority
          />
        </div>

        <div className="relative max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-green-100">
            <ShieldCheck className="size-4" />
            Secure school administration
          </p>

          <h1 className="mt-6 text-5xl font-bold leading-tight">
            Manage your school from one connected platform.
          </h1>

          <p className="mt-6 text-lg leading-8 text-green-100">
            Access students, teachers, classes, attendance,
            results and school reports securely.
          </p>

          <div className="mt-9 grid grid-cols-2 gap-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.label}
                  className="rounded-2xl bg-white/10 p-4"
                >
                  <Icon className="size-5 text-amber-300" />

                  <p className="mt-3 text-sm font-semibold text-white">
                    {benefit.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <p className="relative text-sm text-green-200">
          Powered by Kosta Technologies
        </p>
      </section>

      <section className="relative flex w-full items-center justify-center bg-slate-50 px-5 py-12 sm:px-6 lg:w-1/2">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,107,62,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.1),transparent_32%)]" />

        <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-200/70 sm:p-10">
          <div className="mb-8 lg:hidden">
            <SchoolLogo
              size="md"
              href="/"
              priority
            />
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.22em] text-green-700">
            Welcome back
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Sign in to your portal
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Use the account issued by the school
            administrator.
          </p>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-700" />

            <p className="text-sm leading-6 text-green-800">
              Secure access for authorized RightPath Academy
              users.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            RightPath Academy · Powered by Kosta Technologies
          </p>
        </div>
      </section>
    </main>
  );
}
