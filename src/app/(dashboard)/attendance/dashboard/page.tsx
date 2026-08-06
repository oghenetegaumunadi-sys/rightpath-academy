import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export const metadata: Metadata = {
  title: "Attendance Dashboard",
};

type AttendanceStatus =
  Database["public"]["Enums"]["attendance_status"];

export default async function AttendanceDashboardPage() {
  const admin = createAdminClient();
  const today = getLagosDate();

  const [
    { data: currentSession, error: sessionError },
    { data: classes, error: classesError },
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

  if (sessionError) {
    console.error("Unable to load current session:", {
      message: sessionError.message,
      code: sessionError.code,
      details: sessionError.details,
      hint: sessionError.hint,
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
    classes?.map((schoolClass) => schoolClass.id) ?? [];

  const [
    { data: enrollments, error: enrollmentError },
    { data: attendanceRows, error: attendanceError },
  ] =
    currentSession && classIds.length
      ? await Promise.all([
          admin
            .from("student_enrollments")
            .select(`
              id,
              class_id,
              student_id,
              students (
                id,
                admission_number,
                surname,
                first_name,
                other_name,
                gender,
                status
              )
            `)
            .in("class_id", classIds)
            .eq(
              "academic_session_id",
              currentSession.id,
            )
            .eq("status", "active"),

          admin
            .from("student_attendance")
            .select(`
              id,
              enrollment_id,
              attendance_date,
              status,
              note,
              student_enrollments!inner (
                id,
                class_id,
                academic_session_id,
                students (
                  id,
                  admission_number,
                  surname,
                  first_name,
                  other_name
                )
              )
            `)
            .eq("attendance_date", today)
            .eq(
              "student_enrollments.academic_session_id",
              currentSession.id,
            ),
        ])
      : [
          {
            data: [],
            error: null,
          },
          {
            data: [],
            error: null,
          },
        ];

  if (enrollmentError) {
    console.error("Unable to load enrollments:", {
      message: enrollmentError.message,
      code: enrollmentError.code,
      details: enrollmentError.details,
      hint: enrollmentError.hint,
    });
  }

  if (attendanceError) {
    console.error("Unable to load attendance:", {
      message: attendanceError.message,
      code: attendanceError.code,
      details: attendanceError.details,
      hint: attendanceError.hint,
    });
  }

  const totalEnrolled = enrollments?.length ?? 0;
  const totalRecorded = attendanceRows?.length ?? 0;

  const totals: Record<AttendanceStatus, number> = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  for (const row of attendanceRows ?? []) {
    totals[row.status] += 1;
  }

  const attendanceRate =
    totalRecorded > 0
      ? Math.round(
          ((totals.present + totals.late) /
            totalRecorded) *
            100,
        )
      : 0;

  const classSummaries =
    classes?.map((schoolClass) => {
      const classEnrollments =
        enrollments?.filter(
          (enrollment) =>
            enrollment.class_id === schoolClass.id,
        ) ?? [];

      const enrollmentIds = new Set(
        classEnrollments.map(
          (enrollment) => enrollment.id,
        ),
      );

      const classAttendance =
        attendanceRows?.filter((row) =>
          enrollmentIds.has(row.enrollment_id),
        ) ?? [];

      const classTotals: Record<
        AttendanceStatus,
        number
      > = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
      };

      for (const row of classAttendance) {
        classTotals[row.status] += 1;
      }

      const enrolledCount = classEnrollments.length;
      const recordedCount = classAttendance.length;

      const levelRelation =
        schoolClass.school_levels;

      const schoolLevel = Array.isArray(levelRelation)
        ? levelRelation[0]
        : levelRelation;

      return {
        id: schoolClass.id,
        name: schoolClass.name,
        schoolLevel:
          schoolLevel?.name ?? "School level",
        enrolledCount,
        recordedCount,
        present: classTotals.present,
        absent: classTotals.absent,
        late: classTotals.late,
        excused: classTotals.excused,
        completed:
          enrolledCount > 0 &&
          recordedCount === enrolledCount,
        rate:
          recordedCount > 0
            ? Math.round(
                ((classTotals.present +
                  classTotals.late) /
                  recordedCount) *
                  100,
              )
            : 0,
      };
    }) ?? [];

  const completedClasses = classSummaries.filter(
    (summary) => summary.completed,
  ).length;

  const attentionStudents =
    attendanceRows
      ?.filter(
        (row) =>
          row.status === "absent" ||
          row.status === "late",
      )
      .map((row) => {
        const enrollmentRelation =
          row.student_enrollments;

        const enrollment = Array.isArray(
          enrollmentRelation,
        )
          ? enrollmentRelation[0]
          : enrollmentRelation;

        const studentRelation = enrollment?.students;

        const student = Array.isArray(studentRelation)
          ? studentRelation[0]
          : studentRelation;

        const schoolClass = classes?.find(
          (item) =>
            item.id === enrollment?.class_id,
        );

        if (!student) {
          return null;
        }

        return {
          id: student.id,
          fullName: [
            student.surname,
            student.first_name,
            student.other_name,
          ]
            .filter(Boolean)
            .join(" "),
          admissionNumber:
            student.admission_number,
          className:
            schoolClass?.name ?? "Unknown class",
          status: row.status,
          note: row.note,
        };
      })
      .filter(
        (
          student,
        ): student is NonNullable<typeof student> =>
          Boolean(student),
      ) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">
            Attendance Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            School-wide attendance for{" "}
            {formatDisplayDate(today)}
            {currentSession?.name
              ? ` · ${currentSession.name}`
              : ""}
          </p>
        </div>

        <Link
          href={`/attendance?date=${today}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
        >
          <CalendarCheck className="size-5" />
          Take Attendance
        </Link>
      </section>

      {!currentSession ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current academic session is active.
          </p>

          <p className="mt-2 text-sm text-amber-800">
            Attendance statistics require an active
            academic session.
          </p>
        </Card>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
        <DashboardStat
          label="Enrolled"
          value={totalEnrolled}
          description="Current-session students"
          icon={Users}
          tone="neutral"
        />

        <DashboardStat
          label="Present"
          value={totals.present}
          description="Marked present"
          icon={CheckCircle2}
          tone="green"
        />

        <DashboardStat
          label="Absent"
          value={totals.absent}
          description="Marked absent"
          icon={UserMinus}
          tone="danger"
        />

        <DashboardStat
          label="Late"
          value={totals.late}
          description="Arrived late"
          icon={Clock3}
          tone="amber"
        />

        <DashboardStat
          label="Excused"
          value={totals.excused}
          description="Excused absence"
          icon={ShieldCheck}
          tone="info"
        />

        <DashboardStat
          label="Attendance Rate"
          value={`${attendanceRate}%`}
          description={`${totalRecorded} records today`}
          icon={CalendarCheck}
          tone="green"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Class Attendance
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {completedClasses} of{" "}
                {classSummaries.length} classes completed
              </p>
            </div>

            <Badge
              variant={
                completedClasses ===
                  classSummaries.length &&
                classSummaries.length > 0
                  ? "success"
                  : "warning"
              }
            >
              {completedClasses}/{classSummaries.length}
              {" "}Completed
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {classSummaries.map((summary) => (
              <Link
                key={summary.id}
                href={`/attendance?class=${summary.id}&date=${today}`}
                className="rounded-2xl border border-slate-200 p-5 transition hover:border-green-300 hover:bg-green-50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <GraduationCap className="size-5" />
                    </div>

                    <div>
                      <p className="font-semibold text-slate-950">
                        {summary.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {summary.schoolLevel}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={
                      summary.completed
                        ? "success"
                        : "warning"
                    }
                  >
                    {summary.completed
                      ? "Completed"
                      : "Pending"}
                  </Badge>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <MiniStat
                    label="Recorded"
                    value={`${summary.recordedCount}/${summary.enrolledCount}`}
                  />

                  <MiniStat
                    label="Present"
                    value={String(summary.present)}
                  />

                  <MiniStat
                    label="Rate"
                    value={`${summary.rate}%`}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">
                    {summary.absent} absent
                  </span>

                  <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                    {summary.late} late
                  </span>

                  <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                    {summary.excused} excused
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Today’s Progress
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Attendance recording completion
          </p>

          <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
            <p className="text-5xl font-semibold text-slate-950">
              {totalEnrolled > 0
                ? Math.round(
                    (totalRecorded / totalEnrolled) *
                      100,
                  )
                : 0}
              %
            </p>

            <p className="mt-3 text-sm text-slate-500">
              {totalRecorded} of {totalEnrolled} students
              recorded
            </p>
          </div>

          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-green-600 transition-all"
              style={{
                width: `${
                  totalEnrolled > 0
                    ? Math.min(
                        100,
                        (totalRecorded /
                          totalEnrolled) *
                          100,
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <Link
            href={`/attendance?date=${today}`}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 px-4 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
          >
            <CalendarCheck className="size-4" />
            Continue Attendance
          </Link>
        </Card>
      </section>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Students Requiring Attention
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Students marked absent or late today
          </p>
        </div>

        {attentionStudents.length ? (
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Admission Number
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Class
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Note
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {attentionStudents.map(
                    (student) => (
                      <tr key={student.id}>
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {student.fullName}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {student.admissionNumber}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {student.className}
                        </td>

                        <td className="px-5 py-4">
                          <Badge
                            variant={
                              student.status === "absent"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {student.status}
                          </Badge>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {student.note ??
                            "No note provided"}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/students/${student.id}`}
                            className="font-semibold text-green-700 hover:text-green-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 py-12 text-center">
            <CheckCircle2 className="mx-auto size-10 text-green-600" />

            <p className="mt-4 font-semibold text-slate-900">
              No absences or late arrivals recorded
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Students marked absent or late will appear
              here.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function DashboardStat({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  description: string;
  icon: typeof Users;
  tone:
    | "green"
    | "amber"
    | "danger"
    | "info"
    | "neutral";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
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
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <p className="font-semibold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}

function getLagosDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
