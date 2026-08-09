import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { redirect } from "next/navigation";

import { ScoreEntryForm } from "@/app/(dashboard)/results/score-entry/score-entry-form";
import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Score Entry",
};

type TeacherScoresPageProps = {
  searchParams: Promise<{
    assignment?: string;
  }>;
};

export default async function TeacherScoresPage({
  searchParams,
}: TeacherScoresPageProps) {
  const {
    assignment: selectedAssignmentId = "",
  } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const {
    data: teacher,
    error: teacherError,
  } = await admin
    .from("teachers")
    .select(`
      id,
      employee_id,
      full_name,
      status
    `)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    teacherError ||
    !teacher ||
    teacher.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  const [
    { data: currentTerm, error: termError },
    { data: components, error: componentError },
    { data: assignmentRows, error: assignmentsError },
  ] = await Promise.all([
    admin
      .from("terms")
      .select(`
        id,
        name,
        academic_session_id,
        status,
        is_current,
        academic_sessions (
          id,
          name
        )
      `)
      .eq("is_current", true)
      .order("starts_on", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

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
      .from("teacher_assignments")
      .select(`
        id,
        class_subject_id,
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
      .eq("teacher_id", teacher.id),
  ]);

  if (termError) {
    console.error("Unable to load current term:", {
      message: termError.message,
      code: termError.code,
      details: termError.details,
      hint: termError.hint,
    });
  }

  if (componentError) {
    console.error(
      "Unable to load assessment components:",
      {
        message: componentError.message,
        code: componentError.code,
        details: componentError.details,
        hint: componentError.hint,
      },
    );
  }

  if (assignmentsError) {
    console.error(
      "Unable to load teacher assignments:",
      {
        message: assignmentsError.message,
        code: assignmentsError.code,
        details: assignmentsError.details,
        hint: assignmentsError.hint,
      },
    );
  }

  const assignments =
    assignmentRows
      ?.map((assignment) => {
        const classSubjectRelation =
          assignment.class_subjects;

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
          !classSubject ||
          !schoolClass ||
          !subject
        ) {
          return null;
        }

        if (
          currentTerm &&
          classSubject.academic_session_id !==
            currentTerm.academic_session_id
        ) {
          return null;
        }

        return {
          id: assignment.id,
          classSubjectId: classSubject.id,
          className: schoolClass.name,
          classSortOrder: schoolClass.sort_order,
          subjectName: subject.name,
          subjectCode: subject.code,
        };
      })
      .filter(
        (
          assignment,
        ): assignment is NonNullable<
          typeof assignment
        > => Boolean(assignment),
      )
      .sort((a, b) => {
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
      }) ?? [];

  const selectedAssignment =
    assignments.find(
      (assignment) =>
        assignment.id === selectedAssignmentId,
    ) ?? null;

  if (
    selectedAssignmentId &&
    !selectedAssignment
  ) {
    redirect("/teacher/scores");
  }

  let students: {
    enrollmentId: string;
    studentId: string;
    admissionNumber: string;
    fullName: string;
    existingScores: Record<string, number>;
  }[] = [];

  let sheetStatus: string | null = null;

  if (
    selectedAssignment &&
    currentTerm
  ) {
    const {
      data: classSubject,
      error: classSubjectError,
    } = await admin
      .from("class_subjects")
      .select(`
        id,
        class_id
      `)
      .eq(
        "id",
        selectedAssignment.classSubjectId,
      )
      .maybeSingle();

    if (classSubjectError) {
      console.error(
        "Unable to load class subject:",
        {
          message: classSubjectError.message,
          code: classSubjectError.code,
          details: classSubjectError.details,
          hint: classSubjectError.hint,
        },
      );
    }

    const {
      data: assessmentSheet,
      error: assessmentSheetError,
    } = await admin
      .from("assessment_sheets")
      .select(`
        id,
        status
      `)
      .eq(
        "class_subject_id",
        selectedAssignment.classSubjectId,
      )
      .eq("teacher_id", teacher.id)
      .eq("term_id", currentTerm.id)
      .maybeSingle();

    if (assessmentSheetError) {
      console.error(
        "Unable to load assessment sheet:",
        {
          message: assessmentSheetError.message,
          code: assessmentSheetError.code,
          details: assessmentSheetError.details,
          hint: assessmentSheetError.hint,
        },
      );
    }

    sheetStatus =
      assessmentSheet?.status ?? null;

    const {
      data: enrollments,
      error: enrollmentError,
    } = classSubject
      ? await admin
          .from("student_enrollments")
          .select(`
            id,
            student_id,
            students (
              id,
              admission_number,
              surname,
              first_name,
              other_name
            )
          `)
          .eq(
            "class_id",
            classSubject.class_id,
          )
          .eq(
            "academic_session_id",
            currentTerm.academic_session_id,
          )
          .eq("status", "active")
      : {
          data: [],
          error: null,
        };

    if (enrollmentError) {
      console.error(
        "Unable to load class enrollments:",
        {
          message: enrollmentError.message,
          code: enrollmentError.code,
          details: enrollmentError.details,
          hint: enrollmentError.hint,
        },
      );
    }

    let scoreRows: {
      enrollment_id: string;
      component_id: string;
      raw_score: number;
    }[] = [];

    if (assessmentSheet) {
      const {
        data,
        error: scoresError,
      } = await admin
        .from("student_scores")
        .select(`
          enrollment_id,
          component_id,
          raw_score
        `)
        .eq(
          "assessment_sheet_id",
          assessmentSheet.id,
        );

      if (scoresError) {
        console.error(
          "Unable to load existing scores:",
          {
            message: scoresError.message,
            code: scoresError.code,
            details: scoresError.details,
            hint: scoresError.hint,
          },
        );
      }

      scoreRows = data ?? [];
    }

    students =
      enrollments
        ?.map((enrollment) => {
          const studentRelation =
            enrollment.students;

          const student = Array.isArray(
            studentRelation,
          )
            ? studentRelation[0]
            : studentRelation;

          if (!student) {
            return null;
          }

          const existingScores =
            Object.fromEntries(
              scoreRows
                .filter(
                  (score) =>
                    score.enrollment_id ===
                    enrollment.id,
                )
                .map((score) => [
                  score.component_id,
                  Number(score.raw_score),
                ]),
            );

          return {
            enrollmentId: enrollment.id,
            studentId: student.id,
            admissionNumber:
              student.admission_number,
            fullName: [
              student.surname,
              student.first_name,
              student.other_name,
            ]
              .filter(Boolean)
              .join(" "),
            existingScores,
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
          a.fullName.localeCompare(
            b.fullName,
          ),
        ) ?? [];
  }

  const sessionRelation =
    currentTerm?.academic_sessions;

  const currentSession = Array.isArray(
    sessionRelation,
  )
    ? sessionRelation[0]
    : sessionRelation;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Teacher Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Enter Scores
        </h1>

        <p className="mt-2 text-slate-600">
          Enter CA, Assignment and Examination
          scores for your assigned subjects
          {currentTerm?.name
            ? ` · ${currentTerm.name}`
            : ""}
          {currentSession?.name
            ? ` · ${currentSession.name}`
            : ""}.
        </p>
      </section>

      {!currentTerm ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current term is active.
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Score entry will become available
            when the school activates a term.
          </p>
        </Card>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-950">
          My Assigned Subjects
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select a class and subject to open its
          score sheet.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((assignment) => {
            const active =
              assignment.id ===
              selectedAssignmentId;

            return (
              <Link
                key={assignment.id}
                href={`/teacher/scores?assignment=${assignment.id}`}
                className={[
                  "rounded-2xl border p-5 transition",
                  active
                    ? "border-green-700 bg-green-700 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={[
                      "flex size-11 items-center justify-center rounded-xl",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-green-100 text-green-700",
                    ].join(" ")}
                  >
                    <BookOpen className="size-5" />
                  </div>

                  <Badge
                    variant={
                      active
                        ? "neutral"
                        : "info"
                    }
                  >
                    {assignment.subjectCode}
                  </Badge>
                </div>

                <p className="mt-5 font-semibold">
                  {assignment.subjectName}
                </p>

                <p
                  className={[
                    "mt-1 text-sm",
                    active
                      ? "text-green-100"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {assignment.className}
                </p>
              </Link>
            );
          })}
        </div>

        {!assignments.length ? (
          <Card className="mt-5 border-dashed py-14 text-center">
            <GraduationCap className="mx-auto size-10 text-slate-400" />

            <p className="mt-4 font-semibold text-slate-900">
              No subject assignments
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Your administrator must assign
              class subjects to you before you
              can enter scores.
            </p>
          </Card>
        ) : null}
      </section>

      {selectedAssignment &&
      currentTerm ? (
        <ScoreEntryForm
          key={selectedAssignment.id}
          teacherId={teacher.id}
          classSubjectId={
            selectedAssignment.classSubjectId
          }
          termId={currentTerm.id}
          className={
            selectedAssignment.className
          }
          subjectName={
            selectedAssignment.subjectName
          }
          subjectCode={
            selectedAssignment.subjectCode
          }
          teacherName={
            teacher.full_name
          }
          termName={currentTerm.name}
          components={
            components?.map(
              (component) => ({
                id: component.id,
                name: component.name,
                code: component.code,
                maximumScore:
                  component.maximum_score,
              }),
            ) ?? []
          }
          students={students}
          sheetStatus={sheetStatus}
        />
      ) : assignments.length ? (
        <Card className="border-dashed py-14 text-center">
          <BookOpen className="mx-auto size-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Select a subject
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose one of your assigned subjects
            above to open its score sheet.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
