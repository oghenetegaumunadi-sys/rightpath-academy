import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  Send,
  Users,
  XCircle,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { PublishClassResultsButton } from "./publish-button";

export const metadata: Metadata = {
  title: "Publish Results",
};

export default async function PublishResultsPage() {
  const admin = createAdminClient();

  const [
    { data: currentTerm, error: termError },
    { data: classes, error: classesError },
  ] = await Promise.all([
    admin
      .from("terms")
      .select(`
        id,
        name,
        academic_session_id,
        status,
        academic_sessions (
          id,
          name
        )
      `)
      .eq("is_current", true)
      .maybeSingle(),

    admin
      .from("classes")
      .select(`
        id,
        name,
        sort_order,
        school_levels (
          id,
          name
        )
      `)
      .eq("status", "active")
      .order("sort_order"),
  ]);

  if (termError) {
    console.error("Unable to load current term:", {
      message: termError.message,
      code: termError.code,
      details: termError.details,
      hint: termError.hint,
    });
  }

  if (classesError) {
    console.error("Unable to load classes:", {
      message: classesError.message,
      code: classesError.code,
      details: classesError.details,
      hint: classesError.hint,
    });
  }

  const classIds =
    classes?.map((schoolClass) => schoolClass.id) ??
    [];

  const [
    { data: classSubjects },
    { data: enrollments },
    { data: assessmentSheets },
    { data: termResults },
  ] =
    currentTerm && classIds.length > 0
      ? await Promise.all([
          admin
            .from("class_subjects")
            .select(`
              id,
              class_id,
              subject_id,
              subjects (
                id,
                name,
                code
              )
            `)
            .in("class_id", classIds)
            .eq(
              "academic_session_id",
              currentTerm.academic_session_id,
            ),

          admin
            .from("student_enrollments")
            .select(`
              id,
              class_id
            `)
            .in("class_id", classIds)
            .eq(
              "academic_session_id",
              currentTerm.academic_session_id,
            )
            .eq("status", "active"),

          admin
            .from("assessment_sheets")
            .select(`
              id,
              class_subject_id,
              status
            `)
            .eq("term_id", currentTerm.id),

          admin
            .from("term_results")
            .select(`
              id,
              enrollment_id,
              status,
              student_enrollments!inner (
                id,
                class_id
              )
            `)
            .eq("term_id", currentTerm.id)
            .eq("status", "published"),
        ])
      : [
          { data: [] },
          { data: [] },
          { data: [] },
          { data: [] },
        ];

  const classSummaries =
    classes?.map((schoolClass) => {
      const subjects =
        classSubjects?.filter(
          (item) =>
            item.class_id === schoolClass.id,
        ) ?? [];

      const classEnrollments =
        enrollments?.filter(
          (item) =>
            item.class_id === schoolClass.id,
        ) ?? [];

      const subjectIds = new Set(
        subjects.map((item) => item.id),
      );

      const sheets =
        assessmentSheets?.filter((sheet) =>
          subjectIds.has(sheet.class_subject_id),
        ) ?? [];

      const approvedSubjectIds = new Set(
        sheets
          .filter(
            (sheet) =>
              sheet.status === "approved" ||
              sheet.status === "published",
          )
          .map((sheet) => sheet.class_subject_id),
      );

      const submittedCount = sheets.filter(
        (sheet) => sheet.status === "submitted",
      ).length;

      const rejectedCount = sheets.filter(
        (sheet) => sheet.status === "rejected",
      ).length;

      const draftCount = sheets.filter(
        (sheet) => sheet.status === "draft",
      ).length;

      const publishedStudentCount =
        termResults?.filter((result) => {
          const relation =
            result.student_enrollments;

          const enrollment = Array.isArray(
            relation,
          )
            ? relation[0]
            : relation;

          return (
            enrollment?.class_id ===
            schoolClass.id
          );
        }).length ?? 0;

      const totalSubjects = subjects.length;
      const approvedSubjects =
        approvedSubjectIds.size;

      const ready =
        totalSubjects > 0 &&
        classEnrollments.length > 0 &&
        approvedSubjects === totalSubjects;

      const alreadyPublished =
        classEnrollments.length > 0 &&
        publishedStudentCount ===
          classEnrollments.length;

      const levelRelation =
        schoolClass.school_levels;

      const schoolLevel = Array.isArray(
        levelRelation,
      )
        ? levelRelation[0]
        : levelRelation;

      return {
        id: schoolClass.id,
        name: schoolClass.name,
        schoolLevel:
          schoolLevel?.name ?? "School level",
        totalSubjects,
        approvedSubjects,
        submittedCount,
        rejectedCount,
        draftCount,
        studentCount: classEnrollments.length,
        publishedStudentCount,
        ready,
        alreadyPublished,
      };
    }) ?? [];

  const readyClasses = classSummaries.filter(
    (summary) =>
      summary.ready &&
      !summary.alreadyPublished,
  ).length;

  const publishedClasses =
    classSummaries.filter(
      (summary) => summary.alreadyPublished,
    ).length;

  const pendingClasses =
    classSummaries.filter(
      (summary) =>
        !summary.ready &&
        !summary.alreadyPublished,
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
            Publish Results
          </h1>

          <p className="mt-2 text-slate-600">
            Publish complete class results for{" "}
            {currentTerm?.name ??
              "the current term"}
            {currentSession?.name
              ? ` · ${currentSession.name}`
              : ""}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/results/report-cards"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600"
          >
            <FileCheck2 className="size-5" />
            Report Cards
          </Link>

          <Link
            href="/results/review"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
          >
            <BookOpenCheck className="size-5" />
            Review Results
          </Link>

          <Link
            href="/results/score-entry"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <FileCheck2 className="size-5" />
            Score Entry
          </Link>
        </div>
      </section>

      {!currentTerm ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current term is active.
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Activate a term before publishing results.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <PublishStat
          label="Classes"
          value={classSummaries.length}
          description="Active school classes"
          icon={GraduationCap}
          tone="neutral"
        />

        <PublishStat
          label="Ready"
          value={readyClasses}
          description="All subjects approved"
          icon={CheckCircle2}
          tone="green"
        />

        <PublishStat
          label="Pending"
          value={pendingClasses}
          description="Awaiting approval"
          icon={Clock3}
          tone="amber"
        />

        <PublishStat
          label="Published"
          value={publishedClasses}
          description="Report cards available"
          icon={Send}
          tone="green"
        />
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {classSummaries.map((summary) => (
          <Card
            key={summary.id}
            className="overflow-hidden p-0"
          >
            <div className="border-b border-slate-100 bg-gradient-to-br from-green-50 to-amber-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-green-600 text-white">
                  <GraduationCap className="size-6" />
                </div>

                <Badge
                  variant={
                    summary.alreadyPublished
                      ? "success"
                      : summary.ready
                        ? "info"
                        : summary.rejectedCount > 0
                          ? "danger"
                          : "warning"
                  }
                >
                  {summary.alreadyPublished
                    ? "Published"
                    : summary.ready
                      ? "Ready"
                      : summary.rejectedCount > 0
                        ? "Correction needed"
                        : "Pending"}
                </Badge>
              </div>

              <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                {summary.name}
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                {summary.schoolLevel}
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
              <Metric
                label="Students"
                value={summary.studentCount}
              />

              <Metric
                label="Subjects"
                value={summary.totalSubjects}
              />

              <Metric
                label="Approved"
                value={summary.approvedSubjects}
              />
            </div>

            <div className="space-y-5 p-6">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">
                    Subject approval
                  </span>

                  <span className="font-semibold text-slate-900">
                    {summary.approvedSubjects}/
                    {summary.totalSubjects}
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-green-600"
                    style={{
                      width: `${
                        summary.totalSubjects > 0
                          ? Math.min(
                              100,
                              (summary.approvedSubjects /
                                summary.totalSubjects) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                  {summary.submittedCount} submitted
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  {summary.draftCount} draft
                </span>

                <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">
                  {summary.rejectedCount} rejected
                </span>
              </div>

              {summary.alreadyPublished ? (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="flex items-center gap-2 font-semibold text-green-900">
                    <CheckCircle2 className="size-5" />
                    Results published
                  </p>

                  <p className="mt-2 text-sm text-green-700">
                    {summary.publishedStudentCount} report
                    card
                    {summary.publishedStudentCount === 1
                      ? ""
                      : "s"}{" "}
                    available.
                  </p>
                </div>
              ) : !summary.ready ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-900">
                    Publication unavailable
                  </p>

                  <p className="mt-2 text-sm text-amber-700">
                    Every assigned subject must be
                    approved before publishing this
                    class.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <p className="font-semibold text-green-900">
                    Ready to publish
                  </p>

                  <p className="mt-2 text-sm text-green-700">
                    All assigned subjects have approved
                    result sheets.
                  </p>
                </div>
              )}

              <PublishClassResultsButton
                classId={summary.id}
                termId={currentTerm?.id ?? ""}
                className={summary.name}
                disabled={
                  !currentTerm ||
                  !summary.ready
                }
                alreadyPublished={
                  summary.alreadyPublished
                }
              />

              <Link
                href={`/classes/${summary.id}`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Users className="size-4" />
                Open Class
              </Link>
            </div>
          </Card>
        ))}
      </section>

      {!classSummaries.length ? (
        <Card className="border-dashed py-16 text-center">
          <XCircle className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No classes available
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Active classes will appear here.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function PublishStat({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof GraduationCap;
  tone: "green" | "amber" | "neutral";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            {description}
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

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="px-3 py-5 text-center">
      <p className="text-2xl font-semibold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}
