import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  ClipboardPenLine,
  Plus,
  XCircle,
} from "lucide-react";
import { redirect } from "next/navigation";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title:
    "My Teaching Reports",
};

export default async function TeacherReportsPage() {
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
    data: rows,
    error,
  } = await admin
    .from(
      "daily_teaching_reports",
    )
    .select(`
      id,
      report_date,
      topic_taught,
      lesson_status,
      started_at,
      ended_at,
      students_present,
      notes,
      review_status,
      review_comment,
      reviewed_at,
      created_at,
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
      )
    `)
    .eq(
      "teacher_id",
      teacher.id,
    )
    .order(
      "report_date",
      {
        ascending: false,
      },
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    console.error(
      "Unable to load teacher reports:",
      {
        message:
          error.message,
        code:
          error.code,
        details:
          error.details,
        hint:
          error.hint,
      },
    );
  }

  const reports =
    rows
      ?.map(
        (row) => {
          const relation =
            row.class_subjects;

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
            !schoolClass ||
            !subject
          ) {
            return null;
          }

          return {
            id:
              row.id,
            reportDate:
              row.report_date,
            topicTaught:
              row.topic_taught,
            lessonStatus:
              row.lesson_status,
            startedAt:
              row.started_at,
            endedAt:
              row.ended_at,
            studentsPresent:
              row.students_present,
            notes:
              row.notes,
            reviewStatus:
              row.review_status,
            reviewComment:
              row.review_comment,
            reviewedAt:
              row.reviewed_at,
            className:
              schoolClass.name,
            subjectName:
              subject.name,
            subjectCode:
              subject.code,
          };
        },
      )
      .filter(
        (
          report,
        ): report is NonNullable<
          typeof report
        > =>
          Boolean(
            report,
          ),
      ) ?? [];

  const completed =
    reports.filter(
      (report) =>
        report.lessonStatus ===
        "completed",
    ).length;

  const partial =
    reports.filter(
      (report) =>
        report.lessonStatus ===
        "partially_completed",
    ).length;

  const postponed =
    reports.filter(
      (report) =>
        report.lessonStatus ===
        "postponed",
    ).length;


  const pendingReview =
    reports.filter(
      (report) =>
        report.reviewStatus ===
        "pending",
    ).length;

  const reviewed =
    reports.filter(
      (report) =>
        report.reviewStatus ===
        "reviewed",
    ).length;

  const needsAttention =
    reports.filter(
      (report) =>
        report.reviewStatus ===
        "needs_attention",
    ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
            Teacher Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            My Teaching Reports
          </h1>

          <p className="mt-2 text-slate-600">
            Review your submitted lesson reports.
          </p>
        </div>

        <Link
          href="/teacher/reports/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          <Plus className="size-5" />
          New Report
        </Link>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Total Reports"
          value={
            reports.length
          }
          icon={
            ClipboardPenLine
          }
          tone="neutral"
        />

        <Stat
          label="Completed"
          value={
            completed
          }
          icon={
            CheckCircle2
          }
          tone="green"
        />

        <Stat
          label="Partial"
          value={
            partial
          }
          icon={
            Clock3
          }
          tone="amber"
        />

        <Stat
          label="Postponed"
          value={
            postponed
          }
          icon={
            XCircle
          }
          tone="red"
        />
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        <ReviewStat
          label="Awaiting Review"
          value={pendingReview}
          tone="amber"
        />

        <ReviewStat
          label="Reviewed"
          value={reviewed}
          tone="green"
        />

        <ReviewStat
          label="Needs Attention"
          value={needsAttention}
          tone="red"
        />
      </section>

      <Card className="overflow-hidden p-0">
        {reports.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Class
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Subject
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Topic
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Time
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Present
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Lesson Status
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Review
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Feedback
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {reports.map(
                  (report) => (
                    <tr
                      key={
                        report.id
                      }
                      className="hover:bg-green-50/30"
                    >
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {
                          report.reportDate
                        }
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {
                          report.className
                        }
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {
                            report.subjectName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            report.subjectCode
                          }
                        </p>
                      </td>

                      <td className="max-w-sm px-5 py-4 text-sm leading-6 text-slate-700">
                        {
                          report.topicTaught
                        }
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatTimeRange(
                          report.startedAt,
                          report.endedAt,
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {report.studentsPresent ??
                          "—"}
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            report.lessonStatus ===
                            "completed"
                              ? "success"
                              : report.lessonStatus ===
                                  "partially_completed"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {formatStatus(
                            report.lessonStatus,
                          )}
                        </Badge>
                      </td>


                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            report.reviewStatus ===
                            "reviewed"
                              ? "success"
                              : report.reviewStatus ===
                                  "needs_attention"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {formatStatus(
                            report.reviewStatus,
                          )}
                        </Badge>

                        {report.reviewedAt ? (
                          <p className="mt-2 text-xs text-slate-400">
                            {formatReviewDate(
                              report.reviewedAt,
                            )}
                          </p>
                        ) : null}
                      </td>

                      <td className="max-w-sm px-5 py-4">
                        {report.reviewComment ? (
                          <div
                            className={[
                              "rounded-xl border p-3 text-sm leading-6",
                              report.reviewStatus ===
                              "needs_attention"
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-green-200 bg-green-50 text-green-800",
                            ].join(" ")}
                          >
                            {report.reviewComment}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            No feedback yet
                          </span>
                        )}

                        {report.reviewStatus ===
                        "needs_attention" ? (
                          <Link
                            href={`/teacher/reports/${report.id}/edit`}
                            className="mt-3 inline-flex rounded-lg bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800"
                          >
                            Edit & Resubmit
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <ClipboardPenLine className="mx-auto size-12 text-slate-400" />

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No reports yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Submit your first daily teaching report.
            </p>

            <Link
              href="/teacher/reports/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white"
            >
              <Plus className="size-4" />
              New Report
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon:
    typeof ClipboardPenLine;
  tone:
    | "neutral"
    | "green"
    | "amber"
    | "red";
}) {
  const styles = {
    neutral:
      "bg-slate-100 text-slate-700",
    green:
      "bg-green-100 text-green-700",
    amber:
      "bg-amber-100 text-amber-700",
    red:
      "bg-red-100 text-red-700",
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-950">
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

function ReviewStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "red";
}) {
  const styles = {
    green:
      "border-green-200 bg-green-50 text-green-800",
    amber:
      "border-amber-200 bg-amber-50 text-amber-800",
    red:
      "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <Card className={styles[tone]}>
      <p className="text-sm font-semibold">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold">
        {value}
      </p>
    </Card>
  );
}

function formatReviewDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

function formatStatus(
  value: string,
) {
  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatTimeRange(
  start: string | null,
  end: string | null,
) {
  if (!start && !end) {
    return "—";
  }

  if (
    start &&
    end
  ) {
    return `${start.slice(
      0,
      5,
    )} – ${end.slice(
      0,
      5,
    )}`;
  }

  return (
    start?.slice(
      0,
      5,
    ) ??
    end?.slice(
      0,
      5,
    ) ??
    "—"
  );
}
