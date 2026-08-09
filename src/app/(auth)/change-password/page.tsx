import type { Metadata } from "next";
import {
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";

import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Change Password",
};

export default function ChangePasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(15,107,62,0.08),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.1),transparent_32%)]" />

      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10">
        <SchoolLogo
          size="md"
          href="/"
          priority
        />

        <div className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <KeyRound className="size-6" />
        </div>

        <p className="mt-6 text-sm font-bold uppercase tracking-[0.22em] text-green-700">
          First login
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Create your password
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your surname was only a temporary password.
          Create a private password before entering
          your teacher dashboard.
        </p>

        <div className="mt-6 flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-700" />

          <p className="text-sm leading-6 text-green-800">
            Use at least 8 characters. Your new
            password cannot be your surname.
          </p>
        </div>

        <ChangePasswordForm />
      </div>
    </main>
  );
}
