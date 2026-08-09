import Link from "next/link";
import {
  BarChart3,
  FileText,
  GraduationCap,
} from "lucide-react";
import { redirect } from "next/navigation";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    child?: string;
  }>;
};

export default async function ParentResultsPage({
  searchParams,
}: PageProps) {
  const {
    child: selectedChildId = "",
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
    data: parent,
    error: parentError,
  } = await admin
    .from("parents")
    .select(`
      id,
      full_name,
      status
    `)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    parentError ||
    !parent ||
    parent.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  const [
    { data: currentSession },
    { data: currentTerm },
    { data: links, error: linksError },
  ] = await Promise.all([
    admin
      .from("academic_sessions")
      .select(`
        id,
        name
      `)
      .eq("is_current", true)
      .maybeSingle(),

    admin
      .from("terms")
      .select(`
        id,
        name,
        academic_session_id
      `)
      .eq("is_current", true)
      .maybeSingle(),

    admin
      .from("student_parents")
      .select(`
        student_id,
        students (
          id,
          admission_number,
          surname,
          first_name,
          other_name
        )
      `)
      .eq("parent_id", parent.id),
  ]);

  if (linksError) {
    console.error(
      "Unable to load linked children:",
      linksError,
    );
  }

  const children =
    links
      ?.map((link) => {
        const relation = link.students;

        const student = Array.isArray(relation)
          ? relation[0]
          : relation;

        if (!student) {
          return null;
        }

        return {
          id: student.id,
          admissionNumber:
            student.admission_number,
          fullName: [
            student.surname,
            student.first_name,
            student.other_name,
          ]
            .filter(Boolean)
            .join(" "),
        };
      })
      .filter(
        (
          child,
        ): child is NonNullable<
          typeof child
        > => Boolean(child),
      ) ?? [];

  const activeChild =
    children.find(
      (child) =>
        child.id === selectedChildId,
    ) ??
    children[0] ??
    null;

  if (
    selectedChildId &&
    !children.some(
      (child) =>
        child.id === selectedChildId,
    )
  ) {
    redirect("/parent/results");
  }

  let enrollment:
    | {
        id: string;
        className: string;
      }
    | null = null;

  if (
    activeChild &&
    currentSession
  ) {
    const {
      data: enrollmentRow,
      error: enrollmentError,
    } = await admin
      .from("student_enrollments")
      .select(`
        id,
        classes (
          id,
          name
        )
      `)
      .eq(
        "student_id",
        activeChild.id,
      )
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .eq("status", "active")
      .maybeSingle();

    if (enrollmentError) {
      console.error(
        "Unable to load enrollment:",
        enrollmentError,
      );
    }

    if (enrollmentRow) {
      const relation =
        enrollmentRow.classes;

      const schoolClass =
        Array.isArray(relation)
          ? relation[0]
          : relation;

      if (schoolClass) {
        enrollment = {
          id:
            enrollmentRow.id,
          className:
            schoolClass.name,
        };
      }
    }
  }

  let termResult:
    | {
        id: string;
        averageScore: number;
        totalScore: number;
        classPosition: number | null;
        teacherComment: string | null;
        principalComment: string | null;
        attendancePresent: number;
        attendanceAbsent: number;
        attendanceLate: number;
        publishedAt: string | null;
      }
    | null = null;

  if (
    enrollment &&
    currentTerm
  ) {
    const {
      data: row,
      error,
    } = await admin
      .from("term_results")
      .select(`
        id,
        average_score,
        total_score,
        class_position,
        teacher_comment,
        principal_comment,
        attendance_present,
        attendance_absent,
        attendance_late,
        published_at
      `)
      .eq(
        "enrollment_id",
        enrollment.id,
      )
      .eq(
        "term_id",
        currentTerm.id,
      )
      .eq(
        "status",
        "published",
      )
      .maybeSingle();

    if (error) {
      console.error(
        "Unable to load term result:",
        error,
      );
    }

    if (row) {
      termResult = {
        id: row.id,
        averageScore:
          Number(
            row.average_score,
          ),
        totalScore:
          Number(
            row.total_score,
          ),
        classPosition:
          row.class_position,
        teacherComment:
          row.teacher_comment,
        principalComment:
          row.principal_comment,
        attendancePresent:
          row.attendance_present,
        attendanceAbsent:
          row.attendance_absent,
        attendanceLate:
          row.attendance_late,
        publishedAt:
          row.published_at,
      };
    }
  }

  let subjectResults: {
    id: string;
    subjectName: string;
    subjectCode: string;
    totalScore: number;
    grade: string | null;
    remark: string | null;
    subjectPosition: number | null;
  }[] = [];

  if (
    enrollment &&
    currentTerm &&
    termResult
  ) {
    const {
      data: rows,
      error,
    } = await admin
      .from("subject_results")
      .select(`
        id,
        total_score,
        grade,
        remark,
        subject_position,
        assessment_sheets!inner (
          id,
          status,
          term_id,
          class_subjects (
            id,
            subjects (
              id,
              name,
              code
            )
          )
        )
      `)
      .eq(
        "enrollment_id",
        enrollment.id,
      )
      .eq(
        "assessment_sheets.term_id",
        currentTerm.id,
      )
      .eq(
        "assessment_sheets.status",
        "published",
      );

    if (error) {
      console.error(
        "Unable to load subject results:",
        error,
      );
    }

    subjectResults =
      rows
        ?.map((row) => {
          const sheetRelation =
            row.assessment_sheets;

          const sheet = Array.isArray(
            sheetRelation,
          )
            ? sheetRelation[0]
            : sheetRelation;

          const classSubjectRelation =
            sheet?.class_subjects;

          const classSubject =
            Array.isArray(
              classSubjectRelation,
            )
              ? classSubjectRelation[0]
              : classSubjectRelation;

          const subjectRelation =
            classSubject?.subjects;

          const subject =
            Array.isArray(
              subjectRelation,
            )
              ? subjectRelation[0]
              : subjectRelation;

          if (!subject) {
            return null;
          }

          return {
            id: row.id,
            subjectName:
              subject.name,
            subjectCode:
              subject.code,
            totalScore:
              Number(
                row.total_score,
              ),
            grade:
              row.grade,
            remark:
              row.remark,
            subjectPosition:
              row.subject_position,
          };
        })
        .filter(
          (
            result,
          ): result is NonNullable<
            typeof result
          > => Boolean(result),
        )
        .sort((a, b) =>
          a.subjectName.localeCompare(
            b.subjectName,
          ),
        ) ?? [];
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Parent Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Results
        </h1>

        <p className="mt-2 text-slate-600">
          View published academic results
          {currentTerm?.name
            ? ` · ${currentTerm.name}`
            : ""}
          {currentSession?.name
            ? ` · ${currentSession.name}`
            : ""}.
        </p>
      </section>

      {children.length > 1 ? (
        <section>
          <h2 className="text-sm font-semibold text-slate-700">
            Select Child
          </h2>

          <div className="mt-3 flex flex-wrap gap-3">
            {children.map(
              (child) => {
                const active =
                  child.id ===
                  activeChild?.id;

                return (
                  <Link
                    key={child.id}
                    href={`/parent/results?child=${child.id}`}
                    className={[
                      "rounded-xl border px-4 py-3 text-sm font-semibold transition",
                      active
                        ? "border-green-700 bg-green-700 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50",
                    ].join(" ")}
                  >
                    {child.fullName}
                  </Link>
                );
              },
            )}
          </div>
        </section>
      ) : null}

      {activeChild ? (
        <>
          <Card>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <GraduationCap className="size-5" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">
                      {activeChild.fullName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {activeChild.admissionNumber}
                      {enrollment?.className
                        ? ` · ${enrollment.className}`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {termResult ? (
                <Badge variant="success">
                  Published
                </Badge>
              ) : (
                <Badge variant="warning">
                  Not Published
                </Badge>
              )}
            </div>
          </Card>

          {termResult ? (
            <>
              <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <ResultStat
                  label="Average"
                  value={`${termResult.averageScore.toFixed(
                    1,
                  )}%`}
                />

                <ResultStat
                  label="Total Score"
                  value={termResult.totalScore.toFixed(
                    1,
                  )}
                />

                <ResultStat
                  label="Class Position"
                  value={
                    termResult.classPosition ??
                    "—"
                  }
                />

                <ResultStat
                  label="Subjects"
                  value={subjectResults.length}
                />
              </section>

              <Card className="overflow-hidden p-0">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="size-5 text-green-700" />

                    <div>
                      <h2 className="text-lg font-semibold text-slate-950">
                        Subject Results
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Published subject performance
                      </p>
                    </div>
                  </div>
                </div>

                {subjectResults.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left">
                      <thead className="border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Subject
                          </th>

                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Score
                          </th>

                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Grade
                          </th>

                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Position
                          </th>

                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                            Remark
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {subjectResults.map(
                          (result) => (
                            <tr
                              key={result.id}
                              className="hover:bg-green-50/30"
                            >
                              <td className="px-6 py-4">
                                <p className="font-semibold text-slate-900">
                                  {
                                    result.subjectName
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    result.subjectCode
                                  }
                                </p>
                              </td>

                              <td className="px-6 py-4 font-bold text-slate-800">
                                {result.totalScore.toFixed(
                                  1,
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <Badge
                                  variant={
                                    getGradeVariant(
                                      result.grade,
                                    )
                                  }
                                >
                                  {result.grade ??
                                    "—"}
                                </Badge>
                              </td>

                              <td className="px-6 py-4 text-slate-700">
                                {result.subjectPosition ??
                                  "—"}
                              </td>

                              <td className="px-6 py-4 text-sm text-slate-600">
                                {result.remark ??
                                  "—"}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="px-6 py-14 text-center">
                    <FileText className="mx-auto size-11 text-slate-400" />

                    <p className="mt-4 font-semibold text-slate-900">
                      No published subject results
                    </p>
                  </div>
                )}
              </Card>

              <section className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Attendance Summary
                  </h2>

                  <div className="mt-5 grid grid-cols-3 gap-4">
                    <MiniStat
                      label="Present"
                      value={
                        termResult.attendancePresent
                      }
                    />

                    <MiniStat
                      label="Absent"
                      value={
                        termResult.attendanceAbsent
                      }
                    />

                    <MiniStat
                      label="Late"
                      value={
                        termResult.attendanceLate
                      }
                    />
                  </div>
                </Card>

                <Card>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Comments
                  </h2>

                  <div className="mt-5 space-y-4">
                    <CommentBox
                      label="Teacher Comment"
                      value={
                        termResult.teacherComment
                      }
                    />

                    <CommentBox
                      label="Principal Comment"
                      value={
                        termResult.principalComment
                      }
                    />
                  </div>
                </Card>
              </section>
            </>
          ) : (
            <Card className="border-dashed py-16 text-center">
              <FileText className="mx-auto size-12 text-slate-400" />

              <h2 className="mt-5 text-lg font-semibold text-slate-900">
                Result not published
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                The school has not yet published this
                child&apos;s result for the current term.
              </p>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-dashed py-16 text-center">
          <GraduationCap className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No linked child
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Contact the school administrator to
            link a child to this account.
          </p>
        </Card>
      )}
    </div>
  );
}

function ResultStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <p className="text-sm text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </Card>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function CommentBox({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        {value ??
          "No comment provided."}
      </p>
    </div>
  );
}

function getGradeVariant(
  grade: string | null,
):
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral" {
  if (!grade) {
    return "neutral";
  }

  if (
    grade === "A" ||
    grade === "B"
  ) {
    return "success";
  }

  if (
    grade === "C" ||
    grade === "D"
  ) {
    return "info";
  }

  if (grade === "E") {
    return "warning";
  }

  if (grade === "F") {
    return "danger";
  }

  return "neutral";
}
