import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  Clock3,
  UserMinus,
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

export default async function ParentAttendancePage({
  searchParams,
}: PageProps) {
  const {
    child: selectedChildId = "",
  } = await searchParams;

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
    data: parent,
    error: parentError,
  } = await admin
    .from("parents")
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
    parentError ||
    !parent ||
    parent.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  const [
    { data: currentSession },
    { data: links, error: linksError },
  ] = await Promise.all([
    admin
      .from("academic_sessions")
      .select(`
        id,
        name
      `)
      .eq(
        "is_current",
        true,
      )
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
      .eq(
        "parent_id",
        parent.id,
      ),
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
        const relation =
          link.students;

        const student =
          Array.isArray(relation)
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
    !activeChild
  ) {
    redirect(
      "/parent/attendance",
    );
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
      .eq(
        "status",
        "active",
      )
      .maybeSingle();

    if (enrollmentError) {
      console.error(
        "Unable to load child enrollment:",
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

  let attendanceRows: {
    id: string;
    attendance_date: string;
    status:
      | "present"
      | "absent"
      | "late"
      | "excused";
    note: string | null;
  }[] = [];

  if (enrollment) {
    const {
      data,
      error,
    } = await admin
      .from("student_attendance")
      .select(`
        id,
        attendance_date,
        status,
        note
      `)
      .eq(
        "enrollment_id",
        enrollment.id,
      )
      .order(
        "attendance_date",
        {
          ascending: false,
        },
      );

    if (error) {
      console.error(
        "Unable to load attendance history:",
        error,
      );
    }

    attendanceRows =
      data ?? [];
  }

  const totals = {
    present:
      attendanceRows.filter(
        (item) =>
          item.status === "present",
      ).length,

    absent:
      attendanceRows.filter(
        (item) =>
          item.status === "absent",
      ).length,

    late:
      attendanceRows.filter(
        (item) =>
          item.status === "late",
      ).length,

    excused:
      attendanceRows.filter(
        (item) =>
          item.status === "excused",
      ).length,
  };

  const recordedDays =
    attendanceRows.length;

  const attendancePercentage =
    recordedDays > 0
      ? Math.round(
          ((totals.present +
            totals.late) /
            recordedDays) *
            100,
        )
      : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Parent Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Attendance
        </h1>

        <p className="mt-2 text-slate-600">
          View your child&apos;s attendance
          history
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
                    href={`/parent/attendance?child=${child.id}`}
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

              <Badge variant="success">
                {attendancePercentage}% Attendance
              </Badge>
            </div>
          </Card>

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <AttendanceStat
              label="Present"
              value={totals.present}
              icon={CheckCircle2}
              tone="green"
            />

            <AttendanceStat
              label="Absent"
              value={totals.absent}
              icon={UserMinus}
              tone="red"
            />

            <AttendanceStat
              label="Late"
              value={totals.late}
              icon={Clock3}
              tone="amber"
            />

            <AttendanceStat
              label="Excused"
              value={totals.excused}
              icon={CalendarCheck}
              tone="blue"
            />
          </section>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-950">
                Attendance History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {recordedDays} recorded school day
                {recordedDays === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            {attendanceRows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Date
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Day
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Note
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {attendanceRows.map(
                      (record) => (
                        <tr
                          key={record.id}
                          className="hover:bg-green-50/30"
                        >
                          <td className="px-6 py-4 font-medium text-slate-800">
                            {formatDate(
                              record.attendance_date,
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDay(
                              record.attendance_date,
                            )}
                          </td>

                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                record.status ===
                                "present"
                                  ? "success"
                                  : record.status ===
                                      "absent"
                                    ? "danger"
                                    : record.status ===
                                        "late"
                                      ? "warning"
                                      : "info"
                              }
                            >
                              {formatStatus(
                                record.status,
                              )}
                            </Badge>
                          </td>

                          <td className="px-6 py-4 text-sm text-slate-600">
                            {record.note ??
                              "—"}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <CalendarCheck className="mx-auto size-12 text-slate-400" />

                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  No attendance records
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Attendance has not yet been
                  recorded for this child during
                  the current session.
                </p>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card className="border-dashed py-16 text-center">
          <CalendarCheck className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No linked child
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Contact the school administrator
            to link a student to this parent account.
          </p>
        </Card>
      )}
    </div>
  );
}

function AttendanceStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof CalendarCheck;
  tone:
    | "green"
    | "red"
    | "amber"
    | "blue";
}) {
  const styles = {
    green:
      "bg-green-100 text-green-700",
    red:
      "bg-red-100 text-red-700",
    amber:
      "bg-amber-100 text-amber-700",
    blue:
      "bg-blue-100 text-blue-700",
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

function formatStatus(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatDate(
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

function formatDay(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      weekday: "long",
    },
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}
