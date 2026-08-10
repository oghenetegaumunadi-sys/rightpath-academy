import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardPenLine,
  Clock3,
  FileText,
  GraduationCap,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherDashboardPage() {
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
      full_name,
      employee_id,
      specialization,
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

  const today = getLagosDate();

  const [
    { data: currentTerm },
    { data: assignmentRows },
    { data: todayReports },
    { data: resultSheets },
  ] = await Promise.all([
    admin
      .from("terms")
      .select(`
        id,
        name,
        academic_session_id,
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

    admin
      .from("daily_teaching_reports")
      .select(`
        id,
        report_date,
        lesson_status,
        review_status,
        review_comment,
        class_subjects (
          classes (
            id,
            name
          ),
          subjects (
            id,
            name,
            code
          )
        )
      `)
      .eq("teacher_id", teacher.id)
      .eq("report_date", today),

    admin
      .from("assessment_sheets")
      .select(`
        id,
        status,
        term_id,
        class_subject_id,
        class_subjects (
          classes (
            id,
            name
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

  const todayWeekday =
    new Date(
      `${today}T12:00:00+01:00`,
    ).getUTCDay();

  let todaySchedule: {
    id: string;
    periodName: string;
    periodNumber: number;
    startsAt: string;
    endsAt: string;
    className: string;
    subjectName: string;
    subjectCode: string;
    room: string | null;
  }[] = [];

  if (
    currentTerm &&
    todayWeekday >= 1 &&
    todayWeekday <= 5
  ) {
    const {
      data: timetableRows,
      error: timetableError,
    } = await admin
      .from("timetable_entries")
      .select(`
        id,
        room,
        weekday,
        school_periods (
          id,
          name,
          period_number,
          starts_at,
          ends_at,
          is_instructional
        ),
        classes (
          id,
          name
        ),
        class_subjects (
          id,
          subjects (
            id,
            name,
            code
          )
        )
      `)
      .eq("teacher_id", teacher.id)
      .eq("term_id", currentTerm.id)
      .eq(
        "academic_session_id",
        currentTerm.academic_session_id,
      )
      .eq("weekday", todayWeekday);

    if (timetableError) {
      console.error(
        "Unable to load today's teacher timetable:",
        timetableError,
      );
    }

    todaySchedule =
      timetableRows
        ?.map((row) => {
          const periodRelation =
            row.school_periods;

          const period =
            Array.isArray(periodRelation)
              ? periodRelation[0]
              : periodRelation;

          const classRelation =
            row.classes;

          const schoolClass =
            Array.isArray(classRelation)
              ? classRelation[0]
              : classRelation;

          const classSubjectRelation =
            row.class_subjects;

          const classSubject =
            Array.isArray(classSubjectRelation)
              ? classSubjectRelation[0]
              : classSubjectRelation;

          const subjectRelation =
            classSubject?.subjects;

          const subject =
            Array.isArray(subjectRelation)
              ? subjectRelation[0]
              : subjectRelation;

          if (
            !period ||
            !period.is_instructional ||
            !schoolClass ||
            !subject
          ) {
            return null;
          }

          return {
            id: row.id,
            periodName: period.name,
            periodNumber:
              period.period_number,
            startsAt:
              period.starts_at,
            endsAt:
              period.ends_at,
            className:
              schoolClass.name,
            subjectName:
              subject.name,
            subjectCode:
              subject.code,
            room:
              row.room,
          };
        })
        .filter(
          (
            entry,
          ): entry is NonNullable<
            typeof entry
          > => Boolean(entry),
        )
        .sort(
          (a, b) =>
            a.periodNumber -
            b.periodNumber,
        ) ?? [];
  }

  const assignments =
    assignmentRows
      ?.map((assignment) => {
        const relation =
          assignment.class_subjects;

        const classSubject = Array.isArray(
          relation,
        )
          ? relation[0]
          : relation;

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
          assignmentId: assignment.id,
          classSubjectId: classSubject.id,
          classId: schoolClass.id,
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

  const uniqueClassIds = [
    ...new Set(
      assignments.map(
        (assignment) =>
          assignment.classId,
      ),
    ),
  ];

  const attendanceRecordedClassIds =
    new Set<string>();

  if (
    currentTerm &&
    uniqueClassIds.length
  ) {
    const {
      data: enrollments,
    } = await admin
      .from("student_enrollments")
      .select(`
        id,
        class_id,
        student_attendance (
          id,
          attendance_date
        )
      `)
      .in("class_id", uniqueClassIds)
      .eq(
        "academic_session_id",
        currentTerm.academic_session_id,
      )
      .eq("status", "active");

    for (const enrollment of enrollments ?? []) {
      const hasTodayAttendance =
        enrollment.student_attendance?.some(
          (record) =>
            record.attendance_date === today,
        ) ?? false;

      if (hasTodayAttendance) {
        attendanceRecordedClassIds.add(
          enrollment.class_id,
        );
      }
    }
  }

  const todayReportCount =
    todayReports?.length ?? 0;

  const needsAttentionCount =
    todayReports?.filter(
      (report) =>
        report.review_status ===
        "needs_attention",
    ).length ?? 0;

  const pendingReviewCount =
    todayReports?.filter(
      (report) =>
        report.review_status ===
        "pending",
    ).length ?? 0;

  const draftSheetCount =
    resultSheets?.filter(
      (sheet) =>
        currentTerm &&
        sheet.term_id ===
          currentTerm.id &&
        ["draft", "rejected"].includes(
          sheet.status,
        ),
    ).length ?? 0;

  const submittedSheetCount =
    resultSheets?.filter(
      (sheet) =>
        currentTerm &&
        sheet.term_id ===
          currentTerm.id &&
        sheet.status ===
          "submitted",
    ).length ?? 0;

  const sessionRelation =
    currentTerm?.academic_sessions;

  const currentSession = Array.isArray(
    sessionRelation,
  )
    ? sessionRelation[0]
    : sessionRelation;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
            Teacher Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Welcome, {teacher.full_name}
          </h1>

          <p className="mt-2 text-slate-600">
            {formatDisplayDate(today)}
            {currentTerm?.name
              ? ` · ${currentTerm.name}`
              : ""}
            {currentSession?.name
              ? ` · ${currentSession.name}`
              : ""}
          </p>
        </div>

        <Badge variant="success">
          {teacher.employee_id}
        </Badge>
      </section>

      <Card>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <Clock3 className="size-5" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Today&apos;s Schedule
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your teaching periods for today.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/teacher/timetable"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 transition hover:text-green-800"
          >
            Full Timetable
            <ArrowRight className="size-4" />
          </Link>
        </div>

        {todayWeekday >= 1 &&
        todayWeekday <= 5 ? (
          todaySchedule.length ? (
            <div className="mt-6 divide-y divide-slate-100">
              {todaySchedule.map(
                (entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-4 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="min-w-28">
                        <p className="font-semibold text-slate-900">
                          {formatTimetableTime(
                            entry.startsAt,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatTimetableTime(
                            entry.endsAt,
                          )}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-950">
                            {entry.subjectName}
                          </p>

                          <Badge variant="info">
                            {entry.subjectCode}
                          </Badge>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {entry.className}
                          {entry.room
                            ? ` · ${entry.room}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <Badge variant="neutral">
                      {entry.periodName}
                    </Badge>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto size-9 text-green-600" />

              <p className="mt-3 font-semibold text-slate-900">
                No lessons assigned today
              </p>

              <p className="mt-1 text-sm text-slate-500">
                You currently have no teaching periods on today&apos;s timetable.
              </p>
            </div>
          )
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <CalendarCheck className="mx-auto size-9 text-slate-400" />

            <p className="mt-3 font-semibold text-slate-900">
              No regular timetable today
            </p>

            <p className="mt-1 text-sm text-slate-500">
              The weekly school timetable runs from Monday to Friday.
            </p>
          </div>
        )}
      </Card>

      {needsAttentionCount > 0 ? (
        <Link
          href="/teacher/reports"
          className="block"
        >
          <Card className="border-red-200 bg-red-50 transition hover:border-red-300">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                <AlertTriangle className="size-5" />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-red-950">
                  Teaching report needs attention
                </p>

                <p className="mt-1 text-sm leading-6 text-red-800">
                  {needsAttentionCount} report
                  {needsAttentionCount === 1
                    ? ""
                    : "s"}{" "}
                  {needsAttentionCount === 1
                    ? "has"
                    : "have"}{" "}
                  feedback from the school
                  administration.
                </p>
              </div>

              <ArrowRight className="size-5 text-red-700" />
            </div>
          </Card>
        </Link>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStat
          label="My Assignments"
          value={assignments.length}
          description="Class-subject assignments"
          icon={BookOpen}
          tone="green"
        />

        <DashboardStat
          label="Attendance Today"
          value={`${attendanceRecordedClassIds.size}/${uniqueClassIds.length}`}
          description="Assigned classes recorded"
          icon={CalendarCheck}
          tone="blue"
        />

        <DashboardStat
          label="Reports Today"
          value={todayReportCount}
          description={`${pendingReviewCount} awaiting review`}
          icon={ClipboardPenLine}
          tone="amber"
        />

        <DashboardStat
          label="Score Sheets"
          value={draftSheetCount}
          description={`${submittedSheetCount} awaiting review`}
          icon={BarChart3}
          tone="purple"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                My Classes & Subjects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Quick access to your current assignments.
              </p>
            </div>

            <Link
              href="/teacher/classes"
              className="text-sm font-semibold text-green-700 hover:text-green-800"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {assignments
              .slice(0, 6)
              .map((assignment) => (
                <div
                  key={assignment.assignmentId}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                      <GraduationCap className="size-5" />
                    </div>

                    <Badge variant="info">
                      {assignment.subjectCode}
                    </Badge>
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-950">
                    {assignment.className}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {assignment.subjectName}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/teacher/attendance?class=${assignment.classId}`}
                      className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-50"
                    >
                      Attendance
                    </Link>

                    <Link
                      href={`/teacher/scores?assignment=${assignment.assignmentId}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Scores
                    </Link>

                    <Link
                      href={`/teacher/reports/new?assignment=${assignment.assignmentId}`}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Report
                    </Link>
                  </div>
                </div>
              ))}
          </div>

          {!assignments.length ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
              <BookOpen className="mx-auto size-10 text-slate-400" />

              <p className="mt-4 font-semibold text-slate-900">
                No assignments yet
              </p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold text-slate-950">
              Today
            </h2>

            <div className="mt-5 space-y-4">
              <QuickStatus
                icon={CalendarCheck}
                label="Attendance"
                value={
                  uniqueClassIds.length
                    ? `${attendanceRecordedClassIds.size} of ${uniqueClassIds.length} classes`
                    : "No classes"
                }
                complete={
                  uniqueClassIds.length > 0 &&
                  attendanceRecordedClassIds.size ===
                    uniqueClassIds.length
                }
              />

              <QuickStatus
                icon={FileText}
                label="Teaching reports"
                value={`${todayReportCount} submitted`}
                complete={
                  todayReportCount > 0
                }
              />

              <QuickStatus
                icon={Clock3}
                label="Awaiting review"
                value={`${pendingReviewCount} report${
                  pendingReviewCount === 1
                    ? ""
                    : "s"
                }`}
                complete={
                  pendingReviewCount === 0
                }
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-slate-950">
              Quick Actions
            </h2>

            <div className="mt-5 space-y-3">
              <QuickLink
                href="/teacher/attendance"
                label="Take Attendance"
                icon={CalendarCheck}
              />

              <QuickLink
                href="/teacher/scores"
                label="Enter Scores"
                icon={BarChart3}
              />

              <QuickLink
                href="/teacher/reports/new"
                label="Submit Teaching Report"
                icon={ClipboardPenLine}
              />

              <QuickLink
                href="/teacher/reports"
                label="View My Reports"
                icon={FileText}
              />
            </div>
          </Card>
        </div>
      </section>
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
  value: string | number;
  description: string;
  icon: typeof BookOpen;
  tone:
    | "green"
    | "blue"
    | "amber"
    | "purple";
}) {
  const styles = {
    green:
      "bg-green-100 text-green-700",
    blue:
      "bg-blue-100 text-blue-700",
    amber:
      "bg-amber-100 text-amber-700",
    purple:
      "bg-purple-100 text-purple-700",
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

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
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

function QuickStatus({
  icon: Icon,
  label,
  value,
  complete,
}: {
  icon: typeof CalendarCheck;
  label: string;
  value: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          complete
            ? "bg-green-100 text-green-700"
            : "bg-amber-100 text-amber-700",
        ].join(" ")}
      >
        {complete ? (
          <CheckCircle2 className="size-5" />
        ) : (
          <Icon className="size-5" />
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {label}
        </p>

        <p className="text-xs text-slate-500">
          {value}
        </p>
      </div>
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
  icon: typeof CalendarCheck;
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

      <ArrowRight className="size-4" />
    </Link>
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
  }).format(
    new Date(`${value}T00:00:00`),
  );
}


function formatTimetableTime(
  value: string,
) {
  const [
    hourString,
    minute,
  ] = value.split(":");

  const date = new Date();

  date.setHours(
    Number(hourString),
    Number(minute),
    0,
    0,
  );

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  ).format(date);
}
