import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardPenLine,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const weekdayNames = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export default async function HeadTeacherDashboardPage() {
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
    data: headTeacherAssignment,
    error: headTeacherError,
  } = await admin
    .from("head_teacher_assignments")
    .select(`
      id,
      school_level_id,
      status,
      school_levels (
        id,
        name
      )
    `)
    .eq("teacher_id", teacher.id)
    .eq("status", "active")
    .maybeSingle();

  if (
    headTeacherError ||
    !headTeacherAssignment
  ) {
    redirect("/unauthorized");
  }

  const levelRelation =
    headTeacherAssignment.school_levels;

  const schoolLevel =
    Array.isArray(levelRelation)
      ? levelRelation[0]
      : levelRelation;

  if (!schoolLevel) {
    redirect("/unauthorized");
  }

  const today =
    getLagosDate();

  const todayWeekday =
    getLagosWeekday();

  const [
    {
      data: currentTerm,
    },
    {
      data: sectionClasses,
    },
    {
      data: schoolPeriods,
    },
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
      .order(
        "starts_on",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle(),

    admin
      .from("classes")
      .select(`
        id,
        name,
        sort_order
      `)
      .eq(
        "school_level_id",
        schoolLevel.id,
      )
      .eq("status", "active")
      .order("sort_order"),

    admin
      .from("school_periods")
      .select(`
        id,
        name,
        period_number,
        starts_at,
        ends_at,
        is_instructional
      `)
      .eq("status", "active")
      .order("period_number"),
  ]);

  const classIds =
    sectionClasses?.map(
      (schoolClass) =>
        schoolClass.id,
    ) ?? [];

  let activeEnrollments: {
    id: string;
    class_id: string;
  }[] = [];

  let attendanceRows: {
    enrollment_id: string;
    status: string;
  }[] = [];

  let sectionAssignments: {
    teacherId: string;
    teacherName: string;
  }[] = [];

  let todayReports: {
    id: string;
    teacher_id: string;
    review_status: string;
  }[] = [];

  let pendingResults: {
    id: string;
    status: string;
  }[] = [];

  let todaySchedule: {
    id: string;
    periodName: string;
    startsAt: string;
    endsAt: string;
    className: string;
    subjectName: string;
    subjectCode: string;
  }[] = [];

  if (
    currentTerm &&
    classIds.length
  ) {
    const [
      {
        data: enrollmentRows,
      },
      {
        data: classSubjectRows,
      },
    ] = await Promise.all([
      admin
        .from("student_enrollments")
        .select(`
          id,
          class_id
        `)
        .in(
          "class_id",
          classIds,
        )
        .eq(
          "academic_session_id",
          currentTerm.academic_session_id,
        )
        .eq("status", "active"),

      admin
        .from("class_subjects")
        .select(`
          id,
          class_id,
          teacher_assignments (
            teacher_id,
            teachers (
              id,
              full_name,
              status
            )
          )
        `)
        .in(
          "class_id",
          classIds,
        )
        .eq(
          "academic_session_id",
          currentTerm.academic_session_id,
        ),
    ]);

    activeEnrollments =
      enrollmentRows ?? [];

    const enrollmentIds =
      activeEnrollments.map(
        (enrollment) =>
          enrollment.id,
      );

    if (
      enrollmentIds.length
    ) {
      const {
        data: attendanceData,
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

      attendanceRows =
        attendanceData ?? [];
    }

    const teacherMap =
      new Map<
        string,
        string
      >();

    for (
      const classSubject of
      classSubjectRows ?? []
    ) {
      const assignments =
        classSubject.teacher_assignments;

      const assignmentList =
        Array.isArray(assignments)
          ? assignments
          : assignments
            ? [assignments]
            : [];

      for (
        const assignment of
        assignmentList
      ) {
        const teacherRelation =
          assignment.teachers;

        const assignedTeacher =
          Array.isArray(
            teacherRelation,
          )
            ? teacherRelation[0]
            : teacherRelation;

        if (
          assignedTeacher &&
          assignedTeacher.status ===
            "active"
        ) {
          teacherMap.set(
            assignment.teacher_id,
            assignedTeacher.full_name,
          );
        }
      }
    }

    sectionAssignments =
      [...teacherMap.entries()]
        .map(
          ([
            teacherId,
            teacherName,
          ]) => ({
            teacherId,
            teacherName,
          }),
        )
        .sort((a, b) =>
          a.teacherName.localeCompare(
            b.teacherName,
          ),
        );

    const sectionTeacherIds =
      sectionAssignments.map(
        (item) =>
          item.teacherId,
      );

    if (
      sectionTeacherIds.length
    ) {
      const [
        {
          data: reportRows,
        },
        {
          data: resultRows,
        },
      ] = await Promise.all([
        admin
          .from(
            "daily_teaching_reports",
          )
          .select(`
            id,
            teacher_id,
            review_status
          `)
          .in(
            "teacher_id",
            sectionTeacherIds,
          )
          .eq(
            "report_date",
            today,
          ),

        admin
          .from(
            "assessment_sheets",
          )
          .select(`
            id,
            status
          `)
          .in(
            "teacher_id",
            sectionTeacherIds,
          )
          .eq(
            "term_id",
            currentTerm.id,
          )
          .eq(
            "status",
            "submitted",
          ),
      ]);

      todayReports =
        reportRows ?? [];

      pendingResults =
        resultRows ?? [];
    }

    if (
      todayWeekday >= 1 &&
      todayWeekday <= 5
    ) {
      const {
        data: timetableRows,
      } = await admin
        .from(
          "timetable_entries",
        )
        .select(`
          id,
          weekday,
          period_id,
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
          ),
          school_periods (
            id,
            name,
            period_number,
            starts_at,
            ends_at,
            is_instructional
          )
        `)
        .eq(
          "teacher_id",
          teacher.id,
        )
        .eq(
          "term_id",
          currentTerm.id,
        )
        .eq(
          "academic_session_id",
          currentTerm.academic_session_id,
        )
        .eq(
          "weekday",
          todayWeekday,
        );

      todaySchedule =
        timetableRows
          ?.map((row) => {
            const classRelation =
              row.classes;

            const schoolClass =
              Array.isArray(
                classRelation,
              )
                ? classRelation[0]
                : classRelation;

            const classSubjectRelation =
              row.class_subjects;

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

            const periodRelation =
              row.school_periods;

            const period =
              Array.isArray(
                periodRelation,
              )
                ? periodRelation[0]
                : periodRelation;

            if (
              !schoolClass ||
              !subject ||
              !period ||
              !period.is_instructional
            ) {
              return null;
            }

            return {
              id:
                row.id,
              periodName:
                period.name,
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
            };
          })
          .filter(
            (
              item,
            ): item is NonNullable<
              typeof item
            > => Boolean(item),
          )
          .sort(
            (a, b) =>
              a.periodNumber -
              b.periodNumber,
          )
          .map(
            ({
              periodNumber: _,
              ...item
            }) => item,
          ) ?? [];
    }
  }

  const totalStudents =
    activeEnrollments.length;

  const recordedAttendanceCount =
    attendanceRows.length;

  const presentCount =
    attendanceRows.filter(
      (row) =>
        row.status ===
        "present",
    ).length;

  const lateCount =
    attendanceRows.filter(
      (row) =>
        row.status === "late",
    ).length;

  const attendancePercentage =
    recordedAttendanceCount > 0
      ? Math.round(
          ((presentCount +
            lateCount) /
            recordedAttendanceCount) *
            100,
        )
      : 0;

  const classesWithAttendance =
    new Set(
      activeEnrollments
        .filter((enrollment) =>
          attendanceRows.some(
            (attendance) =>
              attendance.enrollment_id ===
              enrollment.id,
          ),
        )
        .map(
          (enrollment) =>
            enrollment.class_id,
        ),
    );

  const missingAttendanceClasses =
    classIds.filter(
      (classId) =>
        !classesWithAttendance.has(
          classId,
        ),
    ).length;

  const reportTeacherIds =
    new Set(
      todayReports.map(
        (report) =>
          report.teacher_id,
      ),
    );

  const missingReportCount =
    Math.max(
      sectionAssignments.length -
        reportTeacherIds.size,
      0,
    );

  const reportsNeedsAttention =
    todayReports.filter(
      (report) =>
        report.review_status ===
        "needs_attention",
    ).length;

  const sessionRelation =
    currentTerm?.academic_sessions;

  const currentSession =
    Array.isArray(
      sessionRelation,
    )
      ? sessionRelation[0]
      : sessionRelation;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-3xl bg-green-700 px-6 py-7 text-white shadow-lg shadow-green-700/10 sm:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2 text-green-100">
              <ShieldCheck className="size-5" />

              <p className="text-sm font-semibold">
                {schoolLevel.name} Head Teacher
              </p>
            </div>

            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              Welcome, {teacher.full_name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-green-100">
              Monitor your section while managing your own teaching responsibilities.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-widest text-green-100">
              Current Academic Period
            </p>

            <p className="mt-1 font-semibold">
              {currentSession?.name ??
                "No active session"}
            </p>

            <p className="text-sm text-green-100">
              {currentTerm?.name ??
                "No active term"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={GraduationCap}
          label="Students"
          value={String(
            totalStudents,
          )}
          description={`${sectionClasses?.length ?? 0} active classes`}
        />

        <SummaryCard
          icon={Users}
          label="Section Teachers"
          value={String(
            sectionAssignments.length,
          )}
          description="Teachers assigned to section subjects"
        />

        <SummaryCard
          icon={CalendarCheck}
          label="Attendance Today"
          value={
            recordedAttendanceCount
              ? `${attendancePercentage}%`
              : "Not recorded"
          }
          description={`${recordedAttendanceCount}/${totalStudents} student records`}
        />

        <SummaryCard
          icon={BarChart3}
          label="Pending Results"
          value={String(
            pendingResults.length,
          )}
          description="Submitted sheets awaiting review"
        />
      </section>

      {(missingAttendanceClasses >
        0 ||
        missingReportCount > 0 ||
        reportsNeedsAttention > 0) && (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-amber-950">
                Section Needs Attention
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <AttentionItem
                  label="Classes without attendance"
                  value={
                    missingAttendanceClasses
                  }
                />

                <AttentionItem
                  label="Teachers without reports"
                  value={
                    missingReportCount
                  }
                />

                <AttentionItem
                  label="Reports needing attention"
                  value={
                    reportsNeedsAttention
                  }
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Today&apos;s Teaching Schedule
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {todayWeekday >= 1 &&
                todayWeekday <= 5
                  ? weekdayNames[
                      todayWeekday
                    ]
                  : "Weekend"}{" "}
                · Your personal lessons
              </p>
            </div>

            <Link
              href="/head-teacher/timetable"
              className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
            >
              Full Timetable
              <ArrowRight className="size-4" />
            </Link>
          </div>

          {todaySchedule.length ? (
            <div className="mt-6 divide-y divide-slate-100">
              {todaySchedule.map(
                (entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <Clock3 className="size-5" />
                      </div>

                      <div>
                        <p className="font-semibold text-slate-950">
                          {
                            entry.subjectName
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {
                            entry.className
                          }{" "}
                          ·{" "}
                          {formatTime(
                            entry.startsAt,
                          )}{" "}
                          –{" "}
                          {formatTime(
                            entry.endsAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="info">
                        {
                          entry.subjectCode
                        }
                      </Badge>

                      <Badge variant="neutral">
                        {
                          entry.periodName
                        }
                      </Badge>
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <CheckCircle2 className="mx-auto size-9 text-green-600" />

              <p className="mt-3 font-semibold text-slate-900">
                No lessons scheduled today
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Your timetable does not currently contain a teaching period for today.
              </p>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Quick Actions
          </h2>

          <div className="mt-5 space-y-3">
            <QuickAction
              href="/head-teacher/attendance"
              icon={CalendarCheck}
              title="General Attendance"
              description="Record or monitor section attendance"
            />

            <QuickAction
              href="/head-teacher/section"
              icon={ShieldCheck}
              title="My Section"
              description="View classes and section activity"
            />

            <QuickAction
              href="/head-teacher/scores"
              icon={BarChart3}
              title="Enter Scores"
              description="Manage your own subject results"
            />

            <QuickAction
              href="/head-teacher/reports"
              icon={ClipboardPenLine}
              title="Teaching Reports"
              description="Manage your own daily reports"
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Section Classes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Classes under your supervision
              </p>
            </div>

            <BookOpen className="size-5 text-green-700" />
          </div>

          <div className="mt-5 space-y-3">
            {sectionClasses?.length ? (
              sectionClasses.map(
                (schoolClass) => {
                  const studentCount =
                    activeEnrollments.filter(
                      (enrollment) =>
                        enrollment.class_id ===
                        schoolClass.id,
                    ).length;

                  const hasAttendance =
                    classesWithAttendance.has(
                      schoolClass.id,
                    );

                  return (
                    <div
                      key={
                        schoolClass.id
                      }
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-4"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">
                          {
                            schoolClass.name
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {studentCount} active student
                          {studentCount ===
                          1
                            ? ""
                            : "s"}
                        </p>
                      </div>

                      <Badge
                        variant={
                          hasAttendance
                            ? "success"
                            : "warning"
                        }
                      >
                        {hasAttendance
                          ? "Attendance done"
                          : "Attendance pending"}
                      </Badge>
                    </div>
                  );
                },
              )
            ) : (
              <p className="text-sm text-slate-500">
                No active classes are assigned to this section.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Teaching Report Status
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Today&apos;s reporting across your section
              </p>
            </div>

            <ClipboardPenLine className="size-5 text-green-700" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <MetricBox
              label="Teachers"
              value={
                sectionAssignments.length
              }
            />

            <MetricBox
              label="Reports Filed"
              value={
                reportTeacherIds.size
              }
            />

            <MetricBox
              label="Missing"
              value={
                missingReportCount
              }
            />

            <MetricBox
              label="Needs Attention"
              value={
                reportsNeedsAttention
              }
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function AttentionItem({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white/70 p-4">
      <p className="text-2xl font-bold text-amber-950">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-amber-800">
        {label}
      </p>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof CalendarDays;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <ArrowRight className="size-4 shrink-0 text-slate-400" />
    </Link>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-2xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-500">
        {label}
      </p>
    </div>
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

function getLagosWeekday() {
  const weekday =
    new Intl.DateTimeFormat(
      "en-US",
      {
        weekday: "long",
        timeZone:
          "Africa/Lagos",
      },
    ).format(new Date());

  const map: Record<
    string,
    number
  > = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 7,
  };

  return map[weekday] ?? 0;
}

function formatTime(
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
