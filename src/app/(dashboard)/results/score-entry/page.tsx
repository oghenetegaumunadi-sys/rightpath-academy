import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  GraduationCap,
  UserRound,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { ScoreEntryForm } from "./score-entry-form";

export const metadata: Metadata = {
  title: "Score Entry",
};

type ScoreEntryPageProps = {
  searchParams: Promise<{
    teacher?: string;
    assignment?: string;
  }>;
};

export default async function ScoreEntryPage({
  searchParams,
}: ScoreEntryPageProps) {
  const {
    teacher: selectedTeacherId = "",
    assignment: selectedAssignmentId = "",
  } = await searchParams;

  const admin = createAdminClient();

  const [
    { data: currentTerm, error: termError },
    { data: components, error: componentError },
    { data: teachers, error: teacherError },
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
      .from("teachers")
      .select(`
        id,
        employee_id,
        full_name,
        specialization
      `)
      .eq("status", "active")
      .order("full_name"),
  ]);

  if (termError) {
    console.error("Unable to load current term:", termError);
  }

  if (componentError) {
    console.error(
      "Unable to load assessment components:",
      componentError,
    );
  }

  if (teacherError) {
    console.error("Unable to load teachers:", teacherError);
  }

  const selectedTeacher =
    teachers?.find(
      (teacher) =>
        teacher.id === selectedTeacherId,
    ) ?? null;

  let teacherAssignments: {
    id: string;
    classSubjectId: string;
    className: string;
    subjectName: string;
    subjectCode: string;
  }[] = [];

  if (selectedTeacher && currentTerm) {
    const { data: assignments, error } = await admin
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
      .eq("teacher_id", selectedTeacher.id);

    if (error) {
      console.error(
        "Unable to load teacher assignments:",
        error,
      );
    }

    teacherAssignments =
      assignments
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
            !subject ||
            classSubject.academic_session_id !==
              currentTerm.academic_session_id
          ) {
            return null;
          }

          return {
            id: assignment.id,
            classSubjectId: classSubject.id,
            className: schoolClass.name,
            classSortOrder:
              schoolClass.sort_order,
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
        })
        .map((assignment) => ({
          id: assignment.id,
          classSubjectId: assignment.classSubjectId,
          className: assignment.className,
          subjectName: assignment.subjectName,
          subjectCode: assignment.subjectCode,
        })) ?? [];
  }

  const selectedAssignment =
    teacherAssignments.find(
      (assignment) =>
        assignment.id === selectedAssignmentId,
    ) ?? null;

  let students: {
    enrollmentId: string;
    studentId: string;
    admissionNumber: string;
    fullName: string;
    existingScores: Record<string, number>;
  }[] = [];

  let sheetStatus: string | null = null;

  if (
    selectedTeacher &&
    selectedAssignment &&
    currentTerm
  ) {
    const { data: classSubject } = await admin
      .from("class_subjects")
      .select("id, class_id")
      .eq(
        "id",
        selectedAssignment.classSubjectId,
      )
      .single();

    const { data: assessmentSheet } = await admin
      .from("assessment_sheets")
      .select("id, status")
      .eq(
        "class_subject_id",
        selectedAssignment.classSubjectId,
      )
      .eq("teacher_id", selectedTeacher.id)
      .eq("term_id", currentTerm.id)
      .maybeSingle();

    sheetStatus =
      assessmentSheet?.status ?? null;

    const { data: enrollments } = classSubject
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
          .eq("class_id", classSubject.class_id)
          .eq(
            "academic_session_id",
            currentTerm.academic_session_id,
          )
          .eq("status", "active")
      : { data: [] };

    let scoreRows: {
      enrollment_id: string;
      component_id: string;
      raw_score: number;
    }[] = [];

    if (assessmentSheet) {
      const { data } = await admin
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
          a.fullName.localeCompare(b.fullName),
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
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">
            Assessment Score Entry
          </h1>

        <p className="mt-2 text-slate-600">
          Enter CA, Assignment and Examination scores
          for {currentTerm?.name ?? "the current term"}
          {currentSession?.name
            ? ` · ${currentSession.name}`
            : ""}.
        </p>
        </div>

        <Link
          href="/results/review"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
        >
          Review Results
        </Link>
      </section>

      {!currentTerm ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current term is active.
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Activate a term before entering scores.
          </p>
        </Card>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-950">
          Select a Teacher
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {teachers?.map((teacher) => {
            const active =
              teacher.id === selectedTeacherId;

            return (
              <Link
                key={teacher.id}
                href={`/results/score-entry?teacher=${teacher.id}`}
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
                  <UserRound className="size-5" />
                </div>

                <p className="mt-5 font-semibold">
                  {teacher.full_name}
                </p>

                <p
                  className={[
                    "mt-1 text-sm",
                    active
                      ? "text-green-100"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {teacher.employee_id}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {selectedTeacher ? (
        <section>
          <h2 className="text-lg font-semibold text-slate-950">
            Select Class and Subject
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teacherAssignments.map(
              (assignment) => {
                const active =
                  assignment.id ===
                  selectedAssignmentId;

                return (
                  <Link
                    key={assignment.id}
                    href={`/results/score-entry?teacher=${selectedTeacher.id}&assignment=${assignment.id}`}
                    className={[
                      "rounded-2xl border p-5 transition",
                      active
                        ? "border-green-600 bg-green-600 text-white shadow-md"
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
              },
            )}
          </div>

          {!teacherAssignments.length ? (
            <Card className="mt-4 border-dashed text-center">
              <GraduationCap className="mx-auto size-10 text-slate-400" />

              <p className="mt-4 font-semibold text-slate-900">
                No subject assignments
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Assign class subjects to this teacher
                before entering scores.
              </p>
            </Card>
          ) : null}
        </section>
      ) : null}

      {selectedTeacher &&
      selectedAssignment &&
      currentTerm ? (
        <ScoreEntryForm
          key={`${selectedTeacher.id}-${selectedAssignment.id}`}
          teacherId={selectedTeacher.id}
          classSubjectId={
            selectedAssignment.classSubjectId
          }
          termId={currentTerm.id}
          className={selectedAssignment.className}
          subjectName={
            selectedAssignment.subjectName
          }
          subjectCode={
            selectedAssignment.subjectCode
          }
          teacherName={selectedTeacher.full_name}
          termName={currentTerm.name}
          components={
            components?.map((component) => ({
              id: component.id,
              name: component.name,
              code: component.code,
              maximumScore:
                component.maximum_score,
            })) ?? []
          }
          students={students}
          sheetStatus={sheetStatus}
        />
      ) : (
        <Card className="border-dashed py-14 text-center">
          <BookOpen className="mx-auto size-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            Select a teacher and subject
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose a teacher and one of their assigned
            class subjects to open the score sheet.
          </p>
        </Card>
      )}
    </div>
  );
}
