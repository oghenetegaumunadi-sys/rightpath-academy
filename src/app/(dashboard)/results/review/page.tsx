import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  UserRound,
  XCircle,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Review Results",
};

export default async function ResultsReviewPage() {
  const admin = createAdminClient();

  const {
    data: currentTerm,
  } = await admin
    .from("terms")
    .select(`
      id,
      name,
      academic_session_id,
      academic_sessions (
        id,
        name
      )
    `)
    .eq("is_current", true)
    .maybeSingle();

  let sheets: {
    id: string;
    status: string;
    submitted_at: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    teacherName: string;
    employeeId: string;
    className: string;
    subjectName: string;
    subjectCode: string;
    studentCount: number;
  }[] = [];

  if (currentTerm) {
    const {
      data: sheetRows,
      error,
    } = await admin
      .from("assessment_sheets")
      .select(`
        id,
        status,
        submitted_at,
        approved_at,
        rejection_reason,
        teachers (
          id,
          full_name,
          employee_id
        ),
        class_subjects (
          id,
          classes (
            id,
            name
          ),
          subjects (
            id,
            name,
            code
          )
        ),
        subject_results (
          id,
          enrollment_id
        )
      `)
      .eq("term_id", currentTerm.id)
      .in("status", [
        "submitted",
        "approved",
        "rejected",
      ])
      .order("submitted_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Unable to load result sheets:",
        {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      );
    }

    sheets =
      sheetRows
        ?.map((sheet) => {
          const teacherRelation =
            sheet.teachers;

          const teacher = Array.isArray(
            teacherRelation,
          )
            ? teacherRelation[0]
            : teacherRelation;

          const classSubjectRelation =
            sheet.class_subjects;

          const classSubject = Array.isArray(
            classSubjectRelation,
          )
            ? classSubjectRelation[0]
            : classSubjectRelation;

          const classRelation =
            classSubject?.classes;

          const schoolClass = Array.isArray(
            classRelation,
          )
            ? classRelation[0]
            : classRelation;

          const subjectRelation =
            classSubject?.subjects;

          const subject = Array.isArray(
            subjectRelation,
          )
            ? subjectRelation[0]
            : subjectRelation;

          if (
            !teacher ||
            !schoolClass ||
            !subject
          ) {
            return null;
          }

          return {
            id: sheet.id,
            status: sheet.status,
            submitted_at: sheet.submitted_at,
            approved_at: sheet.approved_at,
            rejection_reason:
              sheet.rejection_reason,
            teacherName: teacher.full_name,
            employeeId: teacher.employee_id,
            className: schoolClass.name,
            subjectName: subject.name,
            subjectCode: subject.code,
            studentCount:
              sheet.subject_results?.length ?? 0,
          };
        })
        .filter(
          (
            sheet,
          ): sheet is NonNullable<typeof sheet> =>
            Boolean(sheet),
        ) ?? [];
  }

  const submittedCount = sheets.filter(
    (sheet) => sheet.status === "submitted",
  ).length;

  const approvedCount = sheets.filter(
    (sheet) => sheet.status === "approved",
  ).length;

  const rejectedCount = sheets.filter(
    (sheet) => sheet.status === "rejected",
  ).length;

  const sessionRelation =
    currentTerm?.academic_sessions;

  const currentSession = Array.isArray(
    sessionRelation,
  )
    ? sessionRelation[0]
    : sessionRelation;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">
            Result Review Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Review submitted assessment sheets for{" "}
            {currentTerm?.name ??
              "the current term"}
            {currentSession?.name
              ? ` · ${currentSession.name}`
              : ""}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/results/publish"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <FileCheck2 className="size-5" />
            Publish Results
          </Link>

          <Link
            href="/results/score-entry"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
          >
            <BookOpenCheck className="size-5" />
            Score Entry
          </Link>
        </div>
      </section>

      {!currentTerm ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current term is active.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ReviewStat
          label="Submitted"
          value={submittedCount}
          icon={Clock3}
          tone="amber"
        />

        <ReviewStat
          label="Approved"
          value={approvedCount}
          icon={CheckCircle2}
          tone="green"
        />

        <ReviewStat
          label="Rejected"
          value={rejectedCount}
          icon={XCircle}
          tone="danger"
        />

        <ReviewStat
          label="Total Sheets"
          value={sheets.length}
          icon={FileCheck2}
          tone="neutral"
        />
      </section>

      <Card className="overflow-hidden p-0">
        {sheets.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Class & Subject
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Teacher
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Students
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Submitted
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sheets.map((sheet) => (
                  <tr
                    key={sheet.id}
                    className="transition hover:bg-green-50/30"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">
                        {sheet.subjectName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {sheet.className} ·{" "}
                        {sheet.subjectCode}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-green-100 text-green-700">
                          <UserRound className="size-4" />
                        </div>

                        <div>
                          <p className="font-medium text-slate-800">
                            {sheet.teacherName}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {sheet.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {sheet.studentCount}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {sheet.submitted_at
                        ? formatDateTime(
                            sheet.submitted_at,
                          )
                        : "Not submitted"}
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          sheet.status === "approved"
                            ? "success"
                            : sheet.status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {sheet.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/results/review/${sheet.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                      >
                        <Eye className="size-4" />
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <FileCheck2 className="mx-auto size-12 text-slate-400" />

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No result sheets to review
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Submitted result sheets will appear
              here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function ReviewStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Clock3;
  tone:
    | "green"
    | "amber"
    | "danger"
    | "neutral";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex size-11 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
