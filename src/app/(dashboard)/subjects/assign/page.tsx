import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
} from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { ClassSubjectForm } from "./class-subject-form";

export const metadata: Metadata = {
  title: "Assign Subjects",
};

type AssignSubjectsPageProps = {
  searchParams: Promise<{
    class?: string;
  }>;
};

export default async function AssignSubjectsPage({
  searchParams,
}: AssignSubjectsPageProps) {
  const { class: selectedClassId = "" } =
    await searchParams;

  const supabase = createAdminClient();

  const [
    { data: currentSession },
    { data: classes },
    { data: subjects },
  ] = await Promise.all([
    supabase
      .from("academic_sessions")
      .select("id, name")
      .eq("is_current", true)
      .maybeSingle(),

    supabase
      .from("classes")
      .select("id, name, sort_order")
      .eq("status", "active")
      .order("sort_order"),

    supabase
      .from("subjects")
      .select(`
        id,
        name,
        code,
        description,
        is_core
      `)
      .eq("status", "active")
      .order("name"),
  ]);

  const selectedClass =
    classes?.find(
      (schoolClass) =>
        schoolClass.id === selectedClassId,
    ) ?? null;

  let assignedSubjectIds: string[] = [];

  if (selectedClass && currentSession) {
    const { data: assignments } = await supabase
      .from("class_subjects")
      .select("subject_id")
      .eq("class_id", selectedClass.id)
      .eq(
        "academic_session_id",
        currentSession.id,
      );

    assignedSubjectIds =
      assignments?.map(
        (assignment) => assignment.subject_id,
      ) ?? [];
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to subjects
        </Link>

        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Class Subject Assignment
        </h1>

        <p className="mt-2 text-slate-600">
          Assign subjects to classes for{" "}
          {currentSession?.name ??
            "the current academic session"}.
        </p>
      </div>

      {!currentSession ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current academic session is active.
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Activate an academic session before assigning
            subjects.
          </p>
        </Card>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-950">
          Select a Class
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {classes?.map((schoolClass) => {
            const active =
              schoolClass.id === selectedClassId;

            return (
              <Link
                key={schoolClass.id}
                href={`/subjects/assign?class=${schoolClass.id}`}
                className={[
                  "rounded-2xl border p-5 transition",
                  active
                    ? "border-green-600 bg-green-600 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex size-11 items-center justify-center rounded-xl",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-amber-100 text-amber-700",
                  ].join(" ")}
                >
                  <GraduationCap className="size-5" />
                </div>

                <p className="mt-5 font-semibold">
                  {schoolClass.name}
                </p>

                <p
                  className={[
                    "mt-1 text-sm",
                    active
                      ? "text-green-100"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  Click to manage subjects
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {selectedClass && currentSession ? (
        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                {selectedClass.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {assignedSubjectIds.length} subject
                {assignedSubjectIds.length === 1
                  ? ""
                  : "s"}{" "}
                currently assigned
              </p>
            </div>

            <Badge variant="info">
              {currentSession.name}
            </Badge>
          </div>

          <ClassSubjectForm
            key={selectedClass.id}
            classId={selectedClass.id}
            academicSessionId={currentSession.id}
            subjects={subjects ?? []}
            assignedSubjectIds={assignedSubjectIds}
          />
        </section>
      ) : (
        <Card className="border-dashed text-center">
          <BookOpen className="mx-auto size-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Select a class
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose a class above to assign its subjects.
          </p>
        </Card>
      )}
    </div>
  );
}
