import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpenCheck,
  UserRound,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { ReviewControls } from "./review-controls";

type ResultReviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Review Result Sheet",
};

export default async function ResultReviewPage({
  params,
}: ResultReviewPageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const {
    data: sheet,
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
      terms (
        id,
        name,
        academic_sessions (
          id,
          name
        )
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
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "Unable to load result sheet:",
      {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
    );
  }

  if (!sheet) {
    notFound();
  }

  const [
    { data: components },
    { data: scores },
    { data: results },
  ] = await Promise.all([
    admin
      .from("assessment_components")
      .select(`
        id,
        name,
        code,
        maximum_score,
        sort_order
      `)
      .eq("is_active", true)
      .order("sort_order"),

    admin
      .from("student_scores")
      .select(`
        enrollment_id,
        component_id,
        raw_score
      `)
      .eq("assessment_sheet_id", sheet.id),

    admin
      .from("subject_results")
      .select(`
        enrollment_id,
        total_score,
        grade,
        remark,
        student_enrollments (
          id,
          students (
            id,
            admission_number,
            surname,
            first_name,
            other_name
          )
        )
      `)
      .eq("assessment_sheet_id", sheet.id),
  ]);

  const teacherRelation = sheet.teachers;

  const teacher = Array.isArray(
    teacherRelation,
  )
    ? teacherRelation[0]
    : teacherRelation;

  const termRelation = sheet.terms;

  const term = Array.isArray(termRelation)
    ? termRelation[0]
    : termRelation;

  const sessionRelation =
    term?.academic_sessions;

  const session = Array.isArray(
    sessionRelation,
  )
    ? sessionRelation[0]
    : sessionRelation;

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

  const studentRows =
    results
      ?.map((result) => {
        const enrollmentRelation =
          result.student_enrollments;

        const enrollment = Array.isArray(
          enrollmentRelation,
        )
          ? enrollmentRelation[0]
          : enrollmentRelation;

        const studentRelation =
          enrollment?.students;

        const student = Array.isArray(
          studentRelation,
        )
          ? studentRelation[0]
          : studentRelation;

        if (!student) {
          return null;
        }

        const studentScores =
          Object.fromEntries(
            scores
              ?.filter(
                (score) =>
                  score.enrollment_id ===
                  result.enrollment_id,
              )
              .map((score) => [
                score.component_id,
                Number(score.raw_score),
              ]) ?? [],
          );

        return {
          id: student.id,
          enrollmentId:
            result.enrollment_id,
          admissionNumber:
            student.admission_number,
          fullName: [
            student.surname,
            student.first_name,
            student.other_name,
          ]
            .filter(Boolean)
            .join(" "),
          scores: studentScores,
          totalScore: Number(
            result.total_score,
          ),
          grade: result.grade ?? "—",
          remark: result.remark ?? "—",
        };
      })
      .filter(
        (
          student,
        ): student is NonNullable<
          typeof student
        > => Boolean(student),
      )
      .sort((a, b) =>
        a.fullName.localeCompare(b.fullName),
      ) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <Link
          href="/results/review"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to result review
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold text-slate-950">
                {schoolClass?.name ??
                  "Unknown Class"}{" "}
                —{" "}
                {subject?.name ??
                  "Unknown Subject"}
              </h1>

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
            </div>

            <p className="mt-2 text-slate-600">
              {term?.name ?? "Unknown term"}
              {session?.name
                ? ` · ${session.name}`
                : ""}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
            <UserRound className="size-5 text-green-700" />

            <div>
              <p className="font-semibold text-slate-900">
                {teacher?.full_name ??
                  "Unknown teacher"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {teacher?.employee_id ?? ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      {sheet.rejection_reason ? (
        <Card className="border-red-200 bg-red-50">
          <p className="font-semibold text-red-900">
            Rejection reason
          </p>

          <p className="mt-2 text-sm leading-6 text-red-800">
            {sheet.rejection_reason}
          </p>
        </Card>
      ) : null}

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <BookOpenCheck className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Student Results
            </h2>

            <p className="text-sm text-slate-500">
              {studentRows.length} student
              {studentRows.length === 1
                ? ""
                : "s"}{" "}
              included
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Student
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Admission Number
                  </th>

                  {components?.map(
                    (component) => (
                      <th
                        key={component.id}
                        className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                      >
                        {component.code} /
                        {component.maximum_score}
                      </th>
                    ),
                  )}

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total /100
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Grade
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Remark
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {studentRows.map(
                  (student) => (
                    <tr key={student.enrollmentId}>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {student.fullName}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {student.admissionNumber}
                      </td>

                      {components?.map(
                        (component) => (
                          <td
                            key={component.id}
                            className="px-5 py-4 text-slate-700"
                          >
                            {student.scores[
                              component.id
                            ] ?? "—"}
                          </td>
                        ),
                      )}

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-green-100 px-3 py-2 font-bold text-green-800">
                          {student.totalScore}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            student.totalScore >= 50
                              ? "success"
                              : "danger"
                          }
                        >
                          {student.grade}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-700">
                        {student.remark}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <ReviewControls
        sheetId={sheet.id}
        status={sheet.status}
      />
    </div>
  );
}
