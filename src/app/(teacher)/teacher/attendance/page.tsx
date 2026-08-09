import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  GraduationCap,
  UserCheck,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AttendanceRegister } from "@/app/(dashboard)/attendance/attendance-register";
import {
  Badge,
  Card,
  Input,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export const metadata: Metadata = {
  title: "Take Attendance",
};

type AttendanceStatus =
  Database["public"]["Enums"]["attendance_status"];

type TeacherAttendancePageProps = {
  searchParams: Promise<{
    class?: string;
    assignment?: string;
    date?: string;
  }>;
};

export default async function TeacherAttendancePage({
  searchParams,
}: TeacherAttendancePageProps) {
  const params = await searchParams;

  const selectedDate = isValidDate(
    params.date ?? "",
  )
    ? params.date!
    : getLagosDate();

  const requestedClassId =
    params.class ?? "";

  const requestedAssignmentId =
    params.assignment ?? "";

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin =
    createAdminClient();

  const {
    data: teacher,
    error: teacherError,
  } = await admin
    .from("teachers")
    .select(`
      id,
      full_name,
      employee_id,
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

  const {
    data: currentSession,
    error: sessionError,
  } = await admin
    .from("academic_sessions")
    .select(`
      id,
      name,
      starts_on
    `)
    .eq("is_current", true)
    .order("starts_on", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    console.error(
      "Unable to load current session:",
      {
        message: sessionError.message,
        code: sessionError.code,
        details: sessionError.details,
        hint: sessionError.hint,
      },
    );
  }

  const {
    data: assignmentRows,
    error: assignmentsError,
  } = await admin
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
          sort_order,
          school_levels (
            id,
            name
          )
        ),
        subjects (
          id,
          name,
          code
        )
      )
    `)
    .eq("teacher_id", teacher.id);

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

        const classSubject =
          Array.isArray(
            classSubjectRelation,
          )
            ? classSubjectRelation[0]
            : classSubjectRelation;

        const classRelation =
          classSubject?.classes;

        const schoolClass =
          Array.isArray(classRelation)
            ? classRelation[0]
            : classRelation;

        const subjectRelation =
          classSubject?.subjects;

        const subject =
          Array.isArray(subjectRelation)
            ? subjectRelation[0]
            : subjectRelation;

        const levelRelation =
          schoolClass?.school_levels;

        const schoolLevel =
          Array.isArray(levelRelation)
            ? levelRelation[0]
            : levelRelation;

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
          assignmentId:
            assignment.id,
          classSubjectId:
            classSubject.id,
          classId:
            schoolClass.id,
          className:
            schoolClass.name,
          classSortOrder:
            schoolClass.sort_order,
          schoolLevel:
            schoolLevel?.name ??
            "School level",
          subjectId:
            subject.id,
          subjectName:
            subject.name,
          subjectCode:
            subject.code,
        };
      })
      .filter(
        (
          assignment,
        ): assignment is NonNullable<
          typeof assignment
        > => Boolean(assignment),
      ) ?? [];

  // Attendance is class-wide, not subject-specific.
  // Collapse multiple subject assignments for the same
  // class into one attendance class.
  const classMap = new Map<
    string,
    {
      classId: string;
      className: string;
      classSortOrder: number;
      schoolLevel: string;
      subjects: string[];
    }
  >();

  for (const assignment of assignments) {
    const existing =
      classMap.get(
        assignment.classId,
      );

    const subjectLabel =
      `${assignment.subjectName} (${assignment.subjectCode})`;

    if (existing) {
      if (
        !existing.subjects.includes(
          subjectLabel,
        )
      ) {
        existing.subjects.push(
          subjectLabel,
        );
      }
    } else {
      classMap.set(
        assignment.classId,
        {
          classId:
            assignment.classId,
          className:
            assignment.className,
          classSortOrder:
            assignment.classSortOrder,
          schoolLevel:
            assignment.schoolLevel,
          subjects: [
            subjectLabel,
          ],
        },
      );
    }
  }

  const assignedClasses =
    [...classMap.values()].sort(
      (a, b) =>
        a.classSortOrder -
        b.classSortOrder,
    );

  let selectedClassId =
    requestedClassId;

  if (
    requestedAssignmentId &&
    !selectedClassId
  ) {
    selectedClassId =
      assignments.find(
        (assignment) =>
          assignment.assignmentId ===
          requestedAssignmentId,
      )?.classId ?? "";
  }

  const selectedClass =
    assignedClasses.find(
      (schoolClass) =>
        schoolClass.classId ===
        selectedClassId,
    ) ?? null;

  // Never allow manually supplied class IDs outside
  // this teacher's assignment list.
  if (
    selectedClassId &&
    !selectedClass
  ) {
    redirect(
      "/teacher/attendance",
    );
  }

  let students: {
    enrollmentId: string;
    studentId: string;
    admissionNumber: string;
    fullName: string;
    gender: string;
    existingStatus:
      AttendanceStatus | null;
    existingNote: string;
  }[] = [];

  if (
    selectedClass &&
    currentSession
  ) {
    const {
      data: enrollments,
      error: enrollmentError,
    } = await admin
      .from("student_enrollments")
      .select(`
        id,
        student_id,
        students (
          id,
          admission_number,
          surname,
          first_name,
          other_name,
          gender,
          status
        ),
        student_attendance (
          id,
          attendance_date,
          status,
          note
        )
      `)
      .eq(
        "class_id",
        selectedClass.classId,
      )
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .eq(
        "status",
        "active",
      );

    if (enrollmentError) {
      console.error(
        "Unable to load class enrollments:",
        {
          message:
            enrollmentError.message,
          code: enrollmentError.code,
          details:
            enrollmentError.details,
          hint: enrollmentError.hint,
        },
      );
    }

    students =
      enrollments
        ?.map((enrollment) => {
          const studentRelation =
            enrollment.students;

          const student =
            Array.isArray(
              studentRelation,
            )
              ? studentRelation[0]
              : studentRelation;

          if (!student) {
            return null;
          }

          const attendanceRecord =
            enrollment.student_attendance?.find(
              (record) =>
                record.attendance_date ===
                selectedDate,
            ) ?? null;

          return {
            enrollmentId:
              enrollment.id,
            studentId:
              student.id,
            admissionNumber:
              student.admission_number,
            fullName: [
              student.surname,
              student.first_name,
              student.other_name,
            ]
              .filter(Boolean)
              .join(" "),
            gender:
              student.gender,
            existingStatus:
              attendanceRecord?.status ??
              null,
            existingNote:
              attendanceRecord?.note ??
              "",
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

  function classUrl(
    classId: string,
  ) {
    const query =
      new URLSearchParams({
        class: classId,
        date: selectedDate,
      });

    return `/teacher/attendance?${query.toString()}`;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Teacher Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Take Attendance
        </h1>

        <p className="mt-2 text-slate-600">
          Record attendance only for
          classes assigned to you
          {currentSession?.name
            ? ` during ${currentSession.name}`
            : ""}.
        </p>
      </section>

      {!currentSession ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current academic
            session is active.
          </p>
        </Card>
      ) : null}

      <Card>
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {selectedClassId ? (
            <input
              type="hidden"
              name="class"
              value={
                selectedClassId
              }
            />
          ) : null}

          <div className="w-full sm:max-w-xs">
            <label
              htmlFor="date"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Attendance date
            </label>

            <Input
              id="date"
              name="date"
              type="date"
              defaultValue={
                selectedDate
              }
              required
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3 font-semibold text-white transition hover:bg-green-800"
          >
            <CalendarDays className="size-5" />
            Load Date
          </button>
        </form>
      </Card>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              My Classes
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Only classes linked to
              your teaching assignments
              are available.
            </p>
          </div>

          <Badge variant="info">
            {formatShortDate(
              selectedDate,
            )}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assignedClasses.map(
            (schoolClass) => {
              const active =
                schoolClass.classId ===
                selectedClassId;

              return (
                <Link
                  key={
                    schoolClass.classId
                  }
                  href={classUrl(
                    schoolClass.classId,
                  )}
                  className={[
                    "rounded-2xl border p-5 transition",
                    active
                      ? "border-green-700 bg-green-700 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex size-11 items-center justify-center rounded-xl",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-green-100 text-green-700",
                    ].join(" ")}
                  >
                    <GraduationCap className="size-5" />
                  </div>

                  <p className="mt-5 font-semibold">
                    {
                      schoolClass.className
                    }
                  </p>

                  <p
                    className={[
                      "mt-1 text-sm",
                      active
                        ? "text-green-100"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {
                      schoolClass.schoolLevel
                    }
                  </p>

                  <p
                    className={[
                      "mt-3 line-clamp-2 text-xs leading-5",
                      active
                        ? "text-green-100"
                        : "text-slate-400",
                    ].join(" ")}
                  >
                    {schoolClass.subjects.join(
                      " · ",
                    )}
                  </p>
                </Link>
              );
            },
          )}
        </div>

        {!assignedClasses.length ? (
          <Card className="mt-5 border-dashed py-12 text-center">
            <GraduationCap className="mx-auto size-10 text-slate-400" />

            <p className="mt-4 font-semibold text-slate-900">
              No assigned classes
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Your administrator must
              assign you a class subject
              before you can record
              attendance.
            </p>
          </Card>
        ) : null}
      </section>

      {selectedClass &&
      currentSession ? (
        <AttendanceRegister
          key={`${selectedClass.classId}-${selectedDate}`}
          classId={
            selectedClass.classId
          }
          className={
            selectedClass.className
          }
          attendanceDate={
            selectedDate
          }
          students={students}
        />
      ) : assignedClasses.length ? (
        <Card className="border-dashed py-16 text-center">
          <UserCheck className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            Select a class
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose one of your
            assigned classes to open
            its attendance register.
          </p>
        </Card>
      ) : null}
    </div>
  );
}

function isValidDate(
  value: string,
) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value,
    ) &&
    !Number.isNaN(
      Date.parse(value),
    )
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
  ).format(new Date());
}

function formatShortDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}
