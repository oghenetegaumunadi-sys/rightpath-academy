import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardPenLine,
} from "lucide-react";
import { redirect } from "next/navigation";

import {
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  TeacherReportForm,
} from "./report-form";

export const metadata: Metadata = {
  title:
    "New Teaching Report",
};

type PageProps = {
  searchParams: Promise<{
    assignment?: string;
  }>;
};

export default async function NewTeacherReportPage({
  searchParams,
}: PageProps) {
  const {
    assignment:
      selectedAssignmentId = "",
  } = await searchParams;

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin =
    createAdminClient();

  const {
    data: teacher,
  } = await admin
    .from("teachers")
    .select(`
      id,
      full_name,
      status
    `)
    .eq(
      "profile_id",
      user.id,
    )
    .maybeSingle();

  if (
    !teacher ||
    teacher.status !== "active"
  ) {
    redirect(
      "/unauthorized",
    );
  }

  const {
    data: currentSession,
  } = await admin
    .from(
      "academic_sessions",
    )
    .select(`
      id,
      name,
      starts_on
    `)
    .eq(
      "is_current",
      true,
    )
    .order(
      "starts_on",
      {
        ascending: false,
      },
    )
    .limit(1)
    .maybeSingle();

  const {
    data: assignmentRows,
    error: assignmentsError,
  } = await admin
    .from(
      "teacher_assignments",
    )
    .select(`
      id,
      class_subjects (
        id,
        academic_session_id,
        classes (
          id,
          name,
          sort_order
        ),
        subjects (
          id,
          name,
          code
        )
      )
    `)
    .eq(
      "teacher_id",
      teacher.id,
    );

  if (
    assignmentsError
  ) {
    console.error(
      "Unable to load teacher assignments:",
      assignmentsError,
    );
  }

  const assignments =
    assignmentRows
      ?.map(
        (assignment) => {
          const relation =
            assignment.class_subjects;

          const classSubject =
            Array.isArray(
              relation,
            )
              ? relation[0]
              : relation;

          const classRelation =
            classSubject?.classes;

          const schoolClass =
            Array.isArray(
              classRelation,
            )
              ? classRelation[0]
              : classRelation;

          const subjectRelation =
            classSubject?.subjects;

          const subject =
            Array.isArray(
              subjectRelation,
            )
              ? subjectRelation[0]
              : subjectRelation;

          if (
            !classSubject ||
            !schoolClass ||
            !subject
          ) {
            return null;
          }

          if (
            currentSession &&
            classSubject.academic_session_id !==
              currentSession.id
          ) {
            return null;
          }

          return {
            id:
              assignment.id,
            className:
              schoolClass.name,
            classSortOrder:
              schoolClass.sort_order,
            subjectName:
              subject.name,
            subjectCode:
              subject.code,
          };
        },
      )
      .filter(
        (
          assignment,
        ): assignment is NonNullable<
          typeof assignment
        > =>
          Boolean(
            assignment,
          ),
      )
      .sort(
        (a, b) => {
          if (
            a.classSortOrder !==
            b.classSortOrder
          ) {
            return (
              a.classSortOrder -
              b.classSortOrder
            );
          }

          return a.subjectName.localeCompare(
            b.subjectName,
          );
        },
      )
      .map((assignment) => ({
        id: assignment.id,
        className: assignment.className,
        subjectName: assignment.subjectName,
        subjectCode: assignment.subjectCode,
      })) ?? [];

  if (
    selectedAssignmentId &&
    !assignments.some(
      (assignment) =>
        assignment.id ===
        selectedAssignmentId,
    )
  ) {
    redirect(
      "/teacher/reports/new",
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <Link
          href="/teacher/reports"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          My teaching reports
        </Link>

        <div className="mt-5 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white">
            <ClipboardPenLine className="size-6" />
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
              Teacher Portal
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              New Teaching Report
            </h1>

            <p className="mt-2 text-slate-600">
              Record a lesson you taught
              {currentSession?.name
                ? ` during ${currentSession.name}`
                : ""}.
            </p>
          </div>
        </div>
      </section>

      <Card>
        <TeacherReportForm
          assignments={
            assignments
          }
          defaultDate={
            getLagosDate()
          }
          selectedAssignmentId={
            selectedAssignmentId
          }
        />
      </Card>
    </div>
  );
}

function getLagosDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone:
        "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(
    new Date(),
  );
}
