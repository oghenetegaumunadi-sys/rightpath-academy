import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Users,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { SectionCard } from "@/components/dashboard/section-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function PrincipalDashboardPage() {
  // Always fetch fresh school data for this dashboard.
  noStore();

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const displayName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Principal";

  const today = getLagosDate();

  const [
    { data: currentSession, error: sessionError },
    { data: currentTerm, error: termError },
    { count: studentCount, error: studentCountError },
    { count: teacherCount, error: teacherCountError },
    { count: classCount, error: classCountError },
    { data: announcements, error: announcementError },
    { data: recentStudents, error: recentStudentsError },
  ] = await Promise.all([
    admin
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
      .maybeSingle(),

    admin
      .from("terms")
      .select(`
        id,
        name,
        academic_session_id,
        starts_on
      `)
      .eq("is_current", true)
      .order("starts_on", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    admin
      .from("students")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    admin
      .from("teachers")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    admin
      .from("classes")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "active"),

    admin
      .from("announcements")
      .select(`
        id,
        title,
        starts_at,
        audience_roles
      `)
      .eq("is_published", true)
      .order("starts_at", {
        ascending: false,
      })
      .limit(5),

    admin
      .from("students")
      .select(`
        id,
        admission_number,
        surname,
        first_name,
        other_name,
        admission_date,
        created_at
      `)
      .order("created_at", {
        ascending: false,
      })
      .limit(5),
  ]);

  logError(
    "Unable to load current session",
    sessionError,
  );

  logError(
    "Unable to load current term",
    termError,
  );

  logError(
    "Unable to count students",
    studentCountError,
  );

  logError(
    "Unable to count teachers",
    teacherCountError,
  );

  logError(
    "Unable to count classes",
    classCountError,
  );

  logError(
    "Unable to load announcements",
    announcementError,
  );

  logError(
    "Unable to load recent students",
    recentStudentsError,
  );

  let activeEnrollments: {
    id: string;
    class_id: string;
  }[] = [];

  if (currentSession) {
    const {
      data,
      error,
    } = await admin
      .from("student_enrollments")
      .select(`
        id,
        class_id
      `)
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .eq("status", "active");

    logError(
      "Unable to load active enrollments",
      error,
    );

    activeEnrollments = data ?? [];
  }

  const enrollmentIds =
    activeEnrollments.map(
      (enrollment) => enrollment.id,
    );

  let attendanceRate = 0;
  let attendanceRecorded = 0;
  let presentToday = 0;
  const classesWithAttendance = new Set<string>();

  if (enrollmentIds.length) {
    const {
      data: attendanceRows,
      error,
    } = await admin
      .from("student_attendance")
      .select(`
        enrollment_id,
        status
      `)
      .eq(
        "attendance_date",
        today,
      )
      .in(
        "enrollment_id",
        enrollmentIds,
      );

    logError(
      "Unable to load today's attendance",
      error,
    );

    attendanceRecorded =
      attendanceRows?.length ?? 0;

    presentToday =
      attendanceRows?.filter(
        (record) =>
          record.status === "present" ||
          record.status === "late",
      ).length ?? 0;

    attendanceRate =
      activeEnrollments.length > 0
        ? Math.round(
            (presentToday /
              activeEnrollments.length) *
              100,
          )
        : 0;
  }

  const classesMissingAttendance =
    currentSession
      ? (await admin
          .from("classes")
          .select("id, name, sort_order")
          .eq("status", "active")
          .order("sort_order"))
          .data?.filter(
            (schoolClass) =>
              !classesWithAttendance.has(
                schoolClass.id,
              ),
          ) ?? []
      : [];

  const {
    data: todayTeachingReports,
  } = await admin
    .from("daily_teaching_reports")
    .select("teacher_id")
    .eq("report_date", today);

  const teachersWithReports = new Set(
    todayTeachingReports?.map(
      (report) => report.teacher_id,
    ) ?? [],
  );

  const {
    data: activeTeachers,
  } = await admin
    .from("teachers")
    .select(`
      id,
      employee_id,
      full_name
    `)
    .eq("status", "active")
    .order("full_name");

  const teachersMissingReports =
    activeTeachers?.filter(
      (teacher) =>
        !teachersWithReports.has(
          teacher.id,
        ),
    ) ?? [];

  let pendingResults = 0;

  if (currentTerm) {
    const {
      count,
      error,
    } = await admin
      .from("assessment_sheets")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq(
        "term_id",
        currentTerm.id,
      )
      .eq(
        "status",
        "submitted",
      );

    logError(
      "Unable to count pending result sheets",
      error,
    );

    pendingResults =
      count ?? 0;
  }

  const {
    count: pendingTeachingReports,
    error: teachingReportError,
  } = await admin
    .from("daily_teaching_reports")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq(
      "review_status",
      "pending",
    );

  logError(
    "Unable to count pending teaching reports",
    teachingReportError,
  );

  const recentStudentIds =
    recentStudents?.map(
      (student) => student.id,
    ) ?? [];

  const studentClassMap =
    new Map<string, string>();

  if (
    currentSession &&
    recentStudentIds.length
  ) {
    const {
      data: recentEnrollments,
      error,
    } = await admin
      .from("student_enrollments")
      .select(`
        student_id,
        classes (
          id,
          name
        )
      `)
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .in(
        "student_id",
        recentStudentIds,
      )
      .eq("status", "active");

    logError(
      "Unable to load recent student classes",
      error,
    );

    for (
      const enrollment of
      recentEnrollments ?? []
    ) {
      const relation =
        enrollment.classes;

      const schoolClass =
        Array.isArray(relation)
          ? relation[0]
          : relation;

      if (schoolClass) {
        studentClassMap.set(
          enrollment.student_id,
          schoolClass.name,
        );
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-3xl bg-green-700 px-7 py-8 text-white shadow-lg shadow-green-700/10 sm:px-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-green-100">
              RightPath Academy
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Welcome back, {displayName}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-green-100">
              Live overview of students, staff,
              attendance, results and teaching
              activity.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-400 px-5 py-4 text-slate-950">
            <p className="text-xs font-bold uppercase tracking-widest">
              Current session
            </p>

            <p className="mt-1 text-lg font-semibold">
              {currentSession?.name ??
                "Not configured"}
            </p>

            <p className="text-sm">
              {currentTerm?.name ??
                "No active term"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Students"
          value={String(
            studentCount ?? 0,
          )}
          description="Active registered students"
          icon={GraduationCap}
        />

        <StatCard
          title="Total Teachers"
          value={String(
            teacherCount ?? 0,
          )}
          description="Active teaching staff"
          icon={Users}
        />

        <StatCard
          title="Active Classes"
          value={String(
            classCount ?? 0,
          )}
          description="Currently active classes"
          icon={BookOpen}
        />

        <StatCard
          title="Attendance Today"
          value={`${attendanceRate}%`}
          description={
            attendanceRecorded
              ? `${presentToday} present/late · ${attendanceRecorded} recorded`
              : "Attendance not recorded yet"
          }
          icon={CalendarCheck}
          accent="amber"
        />

        <StatCard
          title="Pending Results"
          value={String(
            pendingResults,
          )}
          description="Submitted sheets awaiting review"
          icon={BarChart3}
          accent="amber"
        />

        <StatCard
          title="Teaching Reports"
          value={String(
            pendingTeachingReports ??
              0,
          )}
          description="Awaiting principal review"
          icon={ClipboardList}
          accent="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <SectionCard
          title="Recent Announcements"
          description="Latest published school notices"
        >
          {announcements?.length ? (
            <div className="space-y-4">
              {announcements.map(
                (announcement) => (
                  <div
                    key={announcement.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {
                          announcement.title
                        }
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(
                          announcement.starts_at,
                        )}
                      </p>
                    </div>

                    <span className="size-2 shrink-0 rounded-full bg-amber-500" />
                  </div>
                ),
              )}
            </div>
          ) : (
            <EmptyState text="No published announcements yet." />
          )}
        </SectionCard>

        <SectionCard
          title="Recent Student Registrations"
          description="Latest students added to the school"
        >
          {recentStudents?.length ? (
            <div className="space-y-4">
              {recentStudents.map(
                (student) => (
                  <Link
                    key={student.id}
                    href={`/students/${student.id}`}
                    className="flex items-center gap-4 rounded-xl border border-slate-100 px-4 py-4 transition hover:border-green-200 hover:bg-green-50/40"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <GraduationCap className="size-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">
                        {[
                          student.surname,
                          student.first_name,
                          student.other_name,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {studentClassMap.get(
                          student.id,
                        ) ??
                          "Not enrolled in a class"}{" "}
                        ·{" "}
                        {
                          student.admission_number
                        }
                      </p>
                    </div>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <EmptyState text="No student registrations yet." />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="Needs Attention Today"
        description="Operational items that may require follow-up"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AttentionItem
            title="Attendance not recorded"
            value={classesMissingAttendance.length}
            description={
              classesMissingAttendance.length
                ? `${classesMissingAttendance
                    .slice(0, 3)
                    .map((item) => item.name)
                    .join(", ")}${
                    classesMissingAttendance.length >
                    3
                      ? " and more"
                      : ""
                  }`
                : "All active classes have attendance records today."
            }
            href="/attendance"
            tone={
              classesMissingAttendance.length
                ? "warning"
                : "success"
            }
          />

          <AttentionItem
            title="Teachers without reports"
            value={teachersMissingReports.length}
            description={
              teachersMissingReports.length
                ? `${teachersMissingReports
                    .slice(0, 3)
                    .map(
                      (teacher) =>
                        teacher.full_name,
                    )
                    .join(", ")}${
                    teachersMissingReports.length >
                    3
                      ? " and more"
                      : ""
                  }`
                : "All active teachers have submitted today."
            }
            href={`/reports/daily-teaching?date=${today}`}
            tone={
              teachersMissingReports.length
                ? "warning"
                : "success"
            }
          />

          <AttentionItem
            title="Teaching reports awaiting review"
            value={
              pendingTeachingReports ?? 0
            }
            description="Open the review queue and respond to teacher submissions."
            href="/reports/daily-teaching?review=pending"
            tone={
              pendingTeachingReports
                ? "warning"
                : "success"
            }
          />

          <AttentionItem
            title="Results awaiting review"
            value={pendingResults}
            description="Submitted assessment sheets waiting for approval or rejection."
            href="/results/review"
            tone={
              pendingResults
                ? "warning"
                : "success"
            }
          />
        </div>
      </SectionCard>

      <section className="grid gap-5 md:grid-cols-2">
        <Link
          href="/results/review"
          className="block"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-green-200 hover:shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-950">
                  Review Submitted Results
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {pendingResults} result sheet
                  {pendingResults === 1
                    ? ""
                    : "s"}{" "}
                  waiting for review.
                </p>
              </div>

              <Badge
                variant={
                  pendingResults
                    ? "warning"
                    : "success"
                }
              >
                {pendingResults}
              </Badge>
            </div>
          </div>
        </Link>

        <Link
          href="/reports/daily-teaching?review=pending"
          className="block"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-green-200 hover:shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-950">
                  Review Teaching Reports
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {pendingTeachingReports ??
                    0}{" "}
                  teaching report
                  {(pendingTeachingReports ??
                    0) === 1
                    ? ""
                    : "s"}{" "}
                  waiting for review.
                </p>
              </div>

              <Badge
                variant={
                  pendingTeachingReports
                    ? "warning"
                    : "success"
                }
              >
                {pendingTeachingReports ??
                  0}
              </Badge>
            </div>
          </div>
        </Link>
      </section>
    </div>
  );
}

function AttentionItem({
  title,
  value,
  description,
  href,
  tone,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
  tone: "warning" | "success";
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-2xl border p-5 transition hover:shadow-sm",
        tone === "warning"
          ? "border-amber-200 bg-amber-50 hover:border-amber-300"
          : "border-green-200 bg-green-50 hover:border-green-300",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={[
              "text-sm font-semibold",
              tone === "warning"
                ? "text-amber-900"
                : "text-green-900",
            ].join(" ")}
          >
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-950">
            {value}
          </p>

          <p
            className={[
              "mt-2 text-sm leading-6",
              tone === "warning"
                ? "text-amber-800"
                : "text-green-800",
            ].join(" ")}
          >
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center">
      <p className="text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}

function getLagosDate() {
  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(new Date());
}

function formatDateTime(
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

function logError(
  label: string,
  error:
    | {
        message: string;
        code?: string;
        details?: string;
        hint?: string;
      }
    | null,
) {
  if (!error) {
    return;
  }

  console.error(label, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}
