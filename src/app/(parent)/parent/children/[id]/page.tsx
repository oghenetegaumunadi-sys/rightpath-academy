import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck,
  FileText,
  GraduationCap,
  UserRound,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParentChildDetailPage({
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
    data: parent,
  } = await admin
    .from("parents")
    .select("id, status")
    .eq(
      "profile_id",
      user.id,
    )
    .maybeSingle();

  if (
    !parent ||
    parent.status !== "active"
  ) {
    redirect(
      "/unauthorized",
    );
  }

  const {
    data: parentLink,
    error: linkError,
  } = await admin
    .from("student_parents")
    .select(`
      relationship,
      is_primary_contact,
      can_pick_up,
      students (
        id,
        admission_number,
        surname,
        first_name,
        other_name,
        gender,
        date_of_birth,
        admission_date,
        residential_address,
        passport_url,
        status
      )
    `)
    .eq(
      "parent_id",
      parent.id,
    )
    .eq(
      "student_id",
      id,
    )
    .maybeSingle();

  if (
    linkError ||
    !parentLink
  ) {
    notFound();
  }

  const relation =
    parentLink.students;

  const student =
    Array.isArray(relation)
      ? relation[0]
      : relation;

  if (!student) {
    notFound();
  }

  const [
    { data: currentSession },
    { data: currentTerm },
  ] = await Promise.all([
    admin
      .from(
        "academic_sessions",
      )
      .select("id, name")
      .eq(
        "is_current",
        true,
      )
      .maybeSingle(),

    admin
      .from("terms")
      .select(`
        id,
        name,
        academic_session_id
      `)
      .eq(
        "is_current",
        true,
      )
      .maybeSingle(),
  ]);

  let enrollment:
    | {
        id: string;
        className: string;
      }
    | null = null;

  if (currentSession) {
    const {
      data: enrollmentRow,
    } = await admin
      .from(
        "student_enrollments",
      )
      .select(`
        id,
        classes (
          id,
          name
        )
      `)
      .eq(
        "student_id",
        student.id,
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

    if (enrollmentRow) {
      const classRelation =
        enrollmentRow.classes;

      const schoolClass =
        Array.isArray(
          classRelation,
        )
          ? classRelation[0]
          : classRelation;

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

  let attendanceSummary = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
  };

  let result:
    | {
        averageScore: number;
        position: number | null;
        status: string;
      }
    | null = null;

  if (enrollment) {
    const {
      data: attendanceRows,
    } = await admin
      .from(
        "student_attendance",
      )
      .select("status")
      .eq(
        "enrollment_id",
        enrollment.id,
      );

    attendanceSummary = {
      present:
        attendanceRows?.filter(
          (row) =>
            row.status ===
            "present",
        ).length ?? 0,

      absent:
        attendanceRows?.filter(
          (row) =>
            row.status ===
            "absent",
        ).length ?? 0,

      late:
        attendanceRows?.filter(
          (row) =>
            row.status ===
            "late",
        ).length ?? 0,

      excused:
        attendanceRows?.filter(
          (row) =>
            row.status ===
            "excused",
        ).length ?? 0,
    };

    if (currentTerm) {
      const {
        data: resultRow,
      } = await admin
        .from("term_results")
        .select(`
          average_score,
          class_position,
          status
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

      if (resultRow) {
        result = {
          averageScore:
            Number(
              resultRow.average_score,
            ),
          position:
            resultRow.class_position,
          status:
            resultRow.status,
        };
      }
    }
  }

  const fullName = [
    student.surname,
    student.first_name,
    student.other_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <Link
          href="/parent/children"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          My Children
        </Link>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-green-100 text-green-700">
            {student.passport_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  student.passport_url
                }
                alt={fullName}
                className="size-full object-cover"
              />
            ) : (
              <GraduationCap className="size-9" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                {fullName}
              </h1>

              <Badge
                variant={
                  student.status ===
                  "active"
                    ? "success"
                    : "neutral"
                }
              >
                {formatStatus(
                  student.status,
                )}
              </Badge>
            </div>

            <p className="mt-2 text-slate-600">
              {student.admission_number}
              {enrollment
                ? ` · ${enrollment.className}`
                : ""}
              {currentSession?.name
                ? ` · ${currentSession.name}`
                : ""}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <UserRound className="size-5" />
            </div>

            <h2 className="text-lg font-semibold text-slate-950">
              Student Information
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            <Detail
              label="Class"
              value={
                enrollment?.className ??
                "Not enrolled"
              }
            />

            <Detail
              label="Gender"
              value={formatStatus(
                student.gender,
              )}
            />

            <Detail
              label="Date of Birth"
              value={
                student.date_of_birth
                  ? formatDate(
                      student.date_of_birth,
                    )
                  : "Not provided"
              }
            />

            <Detail
              label="Admission Date"
              value={formatDate(
                student.admission_date,
              )}
            />

            <Detail
              label="Relationship"
              value={formatStatus(
                parentLink.relationship,
              )}
            />

            <Detail
              label="Pickup Permission"
              value={
                parentLink.can_pick_up
                  ? "Authorized"
                  : "Not authorized"
              }
            />

            <Detail
              label="Residential Address"
              value={
                student.residential_address ??
                "Not provided"
              }
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <CalendarCheck className="size-5" />
            </div>

            <h2 className="text-lg font-semibold text-slate-950">
              Attendance Summary
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <SummaryBox
              label="Present"
              value={
                attendanceSummary.present
              }
            />

            <SummaryBox
              label="Absent"
              value={
                attendanceSummary.absent
              }
            />

            <SummaryBox
              label="Late"
              value={
                attendanceSummary.late
              }
            />

            <SummaryBox
              label="Excused"
              value={
                attendanceSummary.excused
              }
            />
          </div>

          <Link
            href={`/parent/attendance?child=${student.id}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
          >
            View attendance history
          </Link>
        </Card>
      </section>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <FileText className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Current Result
            </h2>

            <p className="text-sm text-slate-500">
              {currentTerm?.name ??
                "Current term"}
            </p>
          </div>
        </div>

        {result ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <SummaryBox
              label="Average"
              value={`${result.averageScore.toFixed(
                1,
              )}%`}
            />

            <SummaryBox
              label="Position"
              value={
                result.position ??
                "—"
              }
            />

            <SummaryBox
              label="Status"
              value="Published"
            />
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="font-semibold text-slate-900">
              Result not published
            </p>

            <p className="mt-2 text-sm text-slate-500">
              The current term result is not yet
              available.
            </p>
          </div>
        )}

        <Link
          href={`/parent/results?child=${student.id}`}
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          View results
        </Link>
      </Card>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-xs text-right text-sm font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
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
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(
      `${value}T00:00:00`,
    ),
  );
}
