import Link from "next/link";
import {
  Bell,
  CalendarCheck,
  ChevronRight,
  FileText,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function ParentDashboardPage() {
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

  const today = getLagosDate();

  const [
    { data: currentSession },
    { data: currentTerm },
    { data: links, error: linksError },
    { data: announcements },
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
        relationship,
        is_primary_contact,
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
      .eq("parent_id", parent.id),

    admin
      .from("announcements")
      .select(`
        id,
        title,
        body,
        starts_at,
        audience_roles
      `)
      .eq("is_published", true)
      .order("starts_at", {
        ascending: false,
      })
      .limit(5),
  ]);

  if (linksError) {
    console.error(
      "Unable to load linked children:",
      {
        message: linksError.message,
        code: linksError.code,
        details: linksError.details,
        hint: linksError.hint,
      },
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
          gender: student.gender,
          status: student.status,
          relationship:
            link.relationship,
          isPrimaryContact:
            link.is_primary_contact,
        };
      })
      .filter(
        (
          child,
        ): child is NonNullable<
          typeof child
        > => Boolean(child),
      ) ?? [];

  const childIds = children.map(
    (child) => child.id,
  );

  const enrollmentMap = new Map<
    string,
    {
      enrollmentId: string;
      classId: string;
      className: string;
    }
  >();

  if (
    currentSession &&
    childIds.length
  ) {
    const {
      data: enrollments,
      error: enrollmentError,
    } = await admin
      .from("student_enrollments")
      .select(`
        id,
        student_id,
        class_id,
        classes (
          id,
          name
        )
      `)
      .in("student_id", childIds)
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .eq("status", "active");

    if (enrollmentError) {
      console.error(
        "Unable to load child enrollments:",
        {
          message:
            enrollmentError.message,
          code:
            enrollmentError.code,
          details:
            enrollmentError.details,
          hint:
            enrollmentError.hint,
        },
      );
    }

    for (const enrollment of
      enrollments ?? []) {
      const relation =
        enrollment.classes;

      const schoolClass =
        Array.isArray(relation)
          ? relation[0]
          : relation;

      if (!schoolClass) {
        continue;
      }

      enrollmentMap.set(
        enrollment.student_id,
        {
          enrollmentId:
            enrollment.id,
          classId:
            schoolClass.id,
          className:
            schoolClass.name,
        },
      );
    }
  }

  const enrollmentIds = [
    ...enrollmentMap.values(),
  ].map(
    (item) => item.enrollmentId,
  );

  const attendanceMap = new Map<
    string,
    string
  >();

  if (enrollmentIds.length) {
    const {
      data: attendanceRows,
      error: attendanceError,
    } = await admin
      .from("student_attendance")
      .select(`
        enrollment_id,
        status
      `)
      .in(
        "enrollment_id",
        enrollmentIds,
      )
      .eq(
        "attendance_date",
        today,
      );

    if (attendanceError) {
      console.error(
        "Unable to load attendance:",
        attendanceError,
      );
    }

    for (const row of
      attendanceRows ?? []) {
      attendanceMap.set(
        row.enrollment_id,
        row.status,
      );
    }
  }

  const latestResultMap = new Map<
    string,
    {
      id: string;
      status: string;
      averageScore: number;
      classPosition:
        number | null;
    }
  >();

  if (
    currentTerm &&
    enrollmentIds.length
  ) {
    const {
      data: resultRows,
      error: resultsError,
    } = await admin
      .from("term_results")
      .select(`
        id,
        enrollment_id,
        status,
        average_score,
        class_position
      `)
      .in(
        "enrollment_id",
        enrollmentIds,
      )
      .eq(
        "term_id",
        currentTerm.id,
      )
      .eq(
        "status",
        "published",
      );

    if (resultsError) {
      console.error(
        "Unable to load published results:",
        resultsError,
      );
    }

    for (const row of
      resultRows ?? []) {
      latestResultMap.set(
        row.enrollment_id,
        {
          id: row.id,
          status: row.status,
          averageScore:
            Number(
              row.average_score,
            ),
          classPosition:
            row.class_position,
        },
      );
    }
  }

  const childCards =
    children.map((child) => {
      const enrollment =
        enrollmentMap.get(
          child.id,
        );

      const attendanceStatus =
        enrollment
          ? attendanceMap.get(
              enrollment.enrollmentId,
            ) ?? null
          : null;

      const result =
        enrollment
          ? latestResultMap.get(
              enrollment.enrollmentId,
            ) ?? null
          : null;

      return {
        ...child,
        className:
          enrollment?.className ??
          "Not enrolled",
        attendanceStatus,
        result,
      };
    });

  const publishedResultsCount =
    childCards.filter(
      (child) =>
        child.result,
    ).length;

  const presentTodayCount =
    childCards.filter(
      (child) =>
        child.attendanceStatus ===
          "present" ||
        child.attendanceStatus ===
          "late",
    ).length;

  const parentAnnouncements =
    announcements?.filter(
      (announcement) =>
        !announcement.audience_roles
          ?.length ||
        announcement.audience_roles.includes(
          "parent",
        ),
    ) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Parent Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Welcome, {parent.full_name}
        </h1>

        <p className="mt-2 text-slate-600">
          Follow your child&apos;s attendance,
          academic results and school updates
          {currentSession?.name
            ? ` · ${currentSession.name}`
            : ""}
          {currentTerm?.name
            ? ` · ${currentTerm.name}`
            : ""}.
        </p>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ParentStat
          label="Linked Children"
          value={childCards.length}
          description="Students connected to your account"
          icon={UsersRound}
        />

        <ParentStat
          label="Present Today"
          value={`${presentTodayCount}/${childCards.length}`}
          description="Present or late today"
          icon={CalendarCheck}
        />

        <ParentStat
          label="Published Results"
          value={publishedResultsCount}
          description="Current term results available"
          icon={FileText}
        />

        <ParentStat
          label="Announcements"
          value={parentAnnouncements.length}
          description="Recent school notices"
          icon={Bell}
        />
      </section>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              My Children
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Current academic overview
            </p>
          </div>

          <Link
            href="/parent/children"
            className="text-sm font-semibold text-green-700 hover:text-green-800"
          >
            View all
          </Link>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {childCards.map(
            (child) => (
              <div
                key={child.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <GraduationCap className="size-6" />
                  </div>

                  {child.isPrimaryContact ? (
                    <Badge variant="success">
                      Primary Contact
                    </Badge>
                  ) : null}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                  {child.fullName}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {child.admissionNumber}
                </p>

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
                  <ChildDetail
                    label="Class"
                    value={
                      child.className
                    }
                  />

                  <ChildDetail
                    label="Attendance Today"
                    value={
                      child.attendanceStatus
                        ? formatStatus(
                            child.attendanceStatus,
                          )
                        : "Not recorded"
                    }
                  />

                  <ChildDetail
                    label="Current Result"
                    value={
                      child.result
                        ? `${child.result.averageScore.toFixed(
                            1,
                          )}% average`
                        : "Not published"
                    }
                  />
                </div>

                <Link
                  href={`/parent/children/${child.id}`}
                  className="mt-5 flex items-center justify-between rounded-xl border border-green-200 px-4 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                >
                  View Child
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            ),
          )}
        </div>

        {!childCards.length ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
            <UsersRound className="mx-auto size-11 text-slate-400" />

            <h3 className="mt-4 font-semibold text-slate-900">
              No linked children
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Contact the school administrator
              to link your children to this parent
              account.
            </p>
          </div>
        ) : null}
      </Card>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Recent Announcements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                School notices for parents
              </p>
            </div>

            <Bell className="size-5 text-green-700" />
          </div>

          <div className="mt-5 space-y-4">
            {parentAnnouncements.length ? (
              parentAnnouncements
                .slice(0, 4)
                .map(
                  (announcement) => (
                    <div
                      key={
                        announcement.id
                      }
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4"
                    >
                      <p className="font-semibold text-slate-900">
                        {
                          announcement.title
                        }
                      </p>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {
                          announcement.body
                        }
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        {formatDate(
                          announcement.starts_at,
                        )}
                      </p>
                    </div>
                  ),
                )
            ) : (
              <p className="text-sm text-slate-500">
                No announcements available.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Quick Access
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View your children&apos;s school records.
          </p>

          <div className="mt-5 space-y-3">
            <QuickLink
              href="/parent/attendance"
              label="View Attendance"
              icon={CalendarCheck}
            />

            <QuickLink
              href="/parent/results"
              label="View Results"
              icon={FileText}
            />

            <QuickLink
              href="/parent/announcements"
              label="School Announcements"
              icon={Bell}
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function ParentStat({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof UsersRound;
}) {
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

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function ChildDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-right font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Bell;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-green-200 hover:bg-green-50 hover:text-green-800"
    >
      <span className="flex items-center gap-3">
        <Icon className="size-4" />
        {label}
      </span>

      <ChevronRight className="size-4" />
    </Link>
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
    new Date(value),
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
