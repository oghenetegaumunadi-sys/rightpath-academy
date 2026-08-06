import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createClient } from "@/lib/supabase/server";

import { StudentRegistrationForm } from "./student-registration-form";

export const metadata: Metadata = {
  title: "Register Student",
};

export default async function NewStudentPage() {
  const supabase = await createClient();

  const [{ data: classes }, { data: sessions }] = await Promise.all([
    supabase
      .from("classes")
      .select("id, name, school_level_id, sort_order, admission_code")
      .eq("status", "active")
      .order("sort_order"),
    supabase
      .from("academic_sessions")
      .select("id, name, is_current")
      .order("starts_on", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/students"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
          >
            <ArrowLeft className="size-4" />
            Back to students
          </Link>

          <h1 className="mt-3 text-3xl font-semibold text-slate-950">
            Register Student
          </h1>

          <p className="mt-2 text-slate-600">
            Add the student, academic placement, and guardian details.
          </p>
        </div>
      </div>

      <StudentRegistrationForm
        classes={classes ?? []}
        sessions={sessions ?? []}
      />
    </div>
  );
}
