import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  GraduationCap,
  UserCheck,
} from "lucide-react";

import {
  Badge,
  Card,
  Input,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

import { AttendanceRegister } from "./attendance-register";

export const metadata: Metadata = {
  title: "Student Attendance",
};

type AttendanceStatus =
  Database["public"]["Enums"]["attendance_status"];

type AttendancePageProps = {
  searchParams: Promise<{
    class?: string;
    date?: string;
  }>;
};

export default async function AttendancePage({
  searchParams,
}: AttendancePageProps) {
  const params = await searchParams;

  const selectedClassId =
    params.class ?? "";

  const selectedDate = isValidDate(
    params.date ?? "",
  )
    ? params.date!
    : new Date().toISOString().slice(0, 10);

  const admin = createAdminClient();

  const [
    { data: currentSession },
    { data: classes },
  ] = await Promise.all([
    admin
      .from("academic_sessions")
      .select("id, name")
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

  const selectedClass =
    classes?.find(
      (schoolClass) =>
        schoolClass.id === selectedClassId,
    ) ?? null;

  let students: {
    enrollmentId: string;
    studentId: string;
    admissionNumber: string;
    fullName: string;
    gender: string;
    existingStatus: AttendanceStatus | null;
    existingNote: string;
  }[] = [];

  if (selectedClass && currentSession) {
    const { data: enrollments } = await admin
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
      .eq("class_id", selectedClass.id)
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .eq("status", "active");

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

          const attendanceRecord =
            enrollment.student_attendance?.find(
              (record) =>
                record.attendance_date ===
                selectedDate,
            ) ?? null;

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
            gender: student.gender,
            existingStatus:
              attendanceRecord?.status ?? null,
            existingNote:
              attendanceRecord?.note ?? "",
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

  const classesUrl = (
    classId: string,
    date: string,
  ) => {
    const query = new URLSearchParams({
      class: classId,
      date,
    });

    return `/attendance?${query.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-green-600 text-white">
            <UserCheck className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-semibold text-slate-950">
              Student Attendance
            </h1>

            <p className="mt-1 text-slate-600">
              Record daily attendance for{" "}
              {currentSession?.name ??
                "the current academic session"}.
            </p>
          </div>
        </div>

        <Link
          href="/attendance/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
        >
          <BarChart3 className="size-5" />
          View Dashboard
        </Link>
      </section>

      {!currentSession ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current academic session is active.
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Activate an academic session before
            recording attendance.
          </p>
        </Card>
      ) : null}

      <Card>
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end">
          {selectedClassId ? (
            <input
              type="hidden"
              name="class"
              value={selectedClassId}
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
              defaultValue={selectedDate}
              required
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
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
              Select a Class
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the class whose register you
              want to open.
            </p>
          </div>

          <Badge variant="info">
            {formatShortDate(selectedDate)}
          </Badge>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {classes?.map((schoolClass) => {
            const active =
              schoolClass.id === selectedClassId;

            const levelRelation =
              schoolClass.school_levels;

            const schoolLevel = Array.isArray(
              levelRelation,
            )
              ? levelRelation[0]
              : levelRelation;

            return (
              <Link
                key={schoolClass.id}
                href={classesUrl(
                  schoolClass.id,
                  selectedDate,
                )}
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
                  <GraduationCap className="size-5" />
                </div>

                <p className="mt-5 font-semibold">
                  {schoolClass.name}
                </p>

                <p
                  className={[
                    "mt-1 text-sm",
                    active
                      ? "text-green-100"
                      : "text-slate-500",
                  ].join(" ")}
                >
                  {schoolLevel?.name ??
                    "School level"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {selectedClass && currentSession ? (
        <AttendanceRegister
          key={`${selectedClass.id}-${selectedDate}`}
          classId={selectedClass.id}
          className={selectedClass.name}
          attendanceDate={selectedDate}
          students={students}
        />
      ) : (
        <Card className="border-dashed py-16 text-center">
          <UserCheck className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            Select a class
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose a class above to open its daily
            attendance register.
          </p>
        </Card>
      )}
    </div>
  );
}

function isValidDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
