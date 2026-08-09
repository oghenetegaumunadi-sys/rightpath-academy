import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquareWarning,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { EditTeachingReportForm } from "./edit-report-form";

export const metadata: Metadata = {
  title: "Edit Teaching Report",
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditTeachingReportPage({
  params,
}: PageProps) {
  const { id } = await params;

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
    .select("id")
    .eq(
      "profile_id",
      user.id,
    )
    .eq(
      "status",
      "active",
    )
    .maybeSingle();

  if (!teacher) {
    redirect(
      "/unauthorized",
    );
  }

  const {
    data: report,
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
      teacher_id,
      class_subjects (
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
    .eq("id", id)
    .eq(
      "teacher_id",
      teacher.id,
    )
    .maybeSingle();

  if (
    error ||
    !report
  ) {
    notFound();
  }

  if (
    report.review_status !==
    "needs_attention"
  ) {
    redirect(
      "/teacher/reports",
    );
  }

  const relation =
    report.class_subjects;

  const classSubject =
    Array.isArray(relation)
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

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section>
        <Link
          href="/teacher/reports"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to my reports
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
          Correct Teaching Report
        </h1>

        <p className="mt-2 text-slate-600">
          {schoolClass?.name ??
            "Class"}{" "}
          ·{" "}
          {subject?.name ??
            "Subject"}{" "}
          ·{" "}
          {report.report_date}
        </p>
      </section>

      <Card className="border-red-200 bg-red-50">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <MessageSquareWarning className="size-5" />
          </div>

          <div>
            <p className="font-semibold text-red-950">
              Administration feedback
            </p>

            <p className="mt-2 text-sm leading-6 text-red-800">
              {report.review_comment ??
                "Please review and correct this report."}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <EditTeachingReportForm
          reportId={report.id}
          topicTaught={
            report.topic_taught
          }
          lessonStatus={
            report.lesson_status
          }
          startedAt={
            report.started_at
          }
          endedAt={
            report.ended_at
          }
          studentsPresent={
            report.students_present
          }
          notes={
            report.notes
          }
        />
      </Card>
    </div>
  );
}
