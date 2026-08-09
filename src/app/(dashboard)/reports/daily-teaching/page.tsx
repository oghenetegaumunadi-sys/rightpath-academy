import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  ClipboardList,
  MessageSquareWarning,
  Plus,
  Search,
  UserCheck,
  UserMinus,
  XCircle,
} from "lucide-react";

import {
  Badge,
  Card,
  Input,
  Select,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { ReviewTeachingReportForm } from "./review-form";

export const metadata: Metadata = {
  title: "Daily Teaching Reports",
};

type DailyTeachingReportsPageProps = {
  searchParams: Promise<{
    date?: string;
    teacher?: string;
    class?: string;
    subject?: string;
    status?: string;
    review?: string;
    search?: string;
  }>;
};

const validLessonStatuses = [
  "completed",
  "partially_completed",
  "postponed",
];

const validReviewStatuses = [
  "pending",
  "reviewed",
  "needs_attention",
];

export default async function DailyTeachingReportsPage({
  searchParams,
}: DailyTeachingReportsPageProps) {
  const params = await searchParams;

  const selectedDate = isValidDate(params.date ?? "")
    ? params.date!
    : getLagosDate();

  const selectedTeacherId = params.teacher ?? "";
  const selectedClassId = params.class ?? "";
  const selectedSubjectId = params.subject ?? "";

  const selectedStatus = validLessonStatuses.includes(
    params.status ?? "",
  )
    ? params.status!
    : "";

  const selectedReviewStatus =
    validReviewStatuses.includes(params.review ?? "")
      ? params.review!
      : "";

  const search = (params.search ?? "").trim();

  const admin = createAdminClient();

  const [
    { data: currentSession, error: sessionError },
    { data: teachers, error: teachersError },
    { data: classes, error: classesError },
    { data: subjects, error: subjectsError },
  ] = await Promise.all([
    admin
      .from("academic_sessions")
      .select("id, name, starts_on")
      .eq("is_current", true)
      .order("starts_on", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle(),

    admin
      .from("teachers")
      .select(`
        id,
        employee_id,
        full_name,
        specialization,
        status
      `)
      .eq("status", "active")
      .order("full_name"),

    admin
      .from("classes")
      .select(`
        id,
        name,
        sort_order
      `)
      .eq("status", "active")
      .order("sort_order"),

    admin
      .from("subjects")
      .select(`
        id,
        name,
        code
      `)
      .eq("status", "active")
      .order("name"),
  ]);

  if (sessionError) {
    console.error("Unable to load current session:", {
      message: sessionError.message,
      code: sessionError.code,
      details: sessionError.details,
      hint: sessionError.hint,
    });
  }

  if (teachersError) {
    console.error("Unable to load teachers:", {
      message: teachersError.message,
      code: teachersError.code,
      details: teachersError.details,
      hint: teachersError.hint,
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

  if (subjectsError) {
    console.error("Unable to load subjects:", {
      message: subjectsError.message,
      code: subjectsError.code,
      details: subjectsError.details,
      hint: subjectsError.hint,
    });
  }

  let reportQuery = admin
    .from("daily_teaching_reports")
    .select(`
      id,
      report_date,
      topic_taught,
      lesson_status,
      started_at,
      ended_at,
      students_present,
      notes,
      review_status,
      review_comment,
      reviewed_at,
      created_at,
      teachers (
        id,
        employee_id,
        full_name,
        specialization
      ),
      class_subjects (
        id,
        class_id,
        subject_id,
        academic_session_id,
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
    .eq("report_date", selectedDate)
    .order("created_at", {
      ascending: false,
    });

  if (selectedTeacherId) {
    reportQuery = reportQuery.eq(
      "teacher_id",
      selectedTeacherId,
    );
  }

  if (selectedStatus) {
    reportQuery = reportQuery.eq(
      "lesson_status",
      selectedStatus,
    );
  }

  if (selectedReviewStatus) {
    reportQuery = reportQuery.eq(
      "review_status",
      selectedReviewStatus,
    );
  }

  const {
    data: reportRows,
    error: reportsError,
  } = await reportQuery;

  if (reportsError) {
    console.error("Unable to load teaching reports:", {
      message: reportsError.message,
      code: reportsError.code,
      details: reportsError.details,
      hint: reportsError.hint,
    });
  }

  const reports =
    reportRows
      ?.map((row) => {
        const teacherRelation = row.teachers;

        const teacher = Array.isArray(
          teacherRelation,
        )
          ? teacherRelation[0]
          : teacherRelation;

        const classSubjectRelation =
          row.class_subjects;

        const classSubject = Array.isArray(
          classSubjectRelation,
        )
          ? classSubjectRelation[0]
          : classSubjectRelation;

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
          !teacher ||
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
          id: row.id,
          reportDate: row.report_date,
          topicTaught: row.topic_taught,
          lessonStatus: row.lesson_status,
          startedAt: row.started_at,
          endedAt: row.ended_at,
          studentsPresent: row.students_present,
          notes: row.notes,
          reviewStatus: row.review_status,
          reviewComment: row.review_comment,
          reviewedAt: row.reviewed_at,
          teacherId: teacher.id,
          teacherName: teacher.full_name,
          employeeId: teacher.employee_id,
          classId: schoolClass.id,
          className: schoolClass.name,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectCode: subject.code,
        };
      })
      .filter(
        (
          report,
        ): report is NonNullable<typeof report> =>
          Boolean(report),
      )
      .filter((report) => {
        if (
          selectedClassId &&
          report.classId !== selectedClassId
        ) {
          return false;
        }

        if (
          selectedSubjectId &&
          report.subjectId !== selectedSubjectId
        ) {
          return false;
        }

        if (!search) {
          return true;
        }

        const value = search.toLowerCase();

        return (
          report.teacherName
            .toLowerCase()
            .includes(value) ||
          report.employeeId
            .toLowerCase()
            .includes(value) ||
          report.className
            .toLowerCase()
            .includes(value) ||
          report.subjectName
            .toLowerCase()
            .includes(value) ||
          report.subjectCode
            .toLowerCase()
            .includes(value) ||
          report.topicTaught
            .toLowerCase()
            .includes(value)
        );
      }) ?? [];

  const teacherIdsWithReports = new Set(
    reports.map((report) => report.teacherId),
  );

  const teachersWhoSubmitted =
    teachers?.filter((teacher) =>
      teacherIdsWithReports.has(teacher.id),
    ) ?? [];

  const teachersWhoHaveNotSubmitted =
    teachers?.filter(
      (teacher) =>
        !teacherIdsWithReports.has(teacher.id),
    ) ?? [];

  const completedCount = reports.filter(
    (report) =>
      report.lessonStatus === "completed",
  ).length;

  const partialCount = reports.filter(
    (report) =>
      report.lessonStatus ===
      "partially_completed",
  ).length;

  const postponedCount = reports.filter(
    (report) =>
      report.lessonStatus === "postponed",
  ).length;

  const pendingReviewCount = reports.filter(
    (report) =>
      report.reviewStatus === "pending",
  ).length;

  const reviewedCount = reports.filter(
    (report) =>
      report.reviewStatus === "reviewed",
  ).length;

  const needsAttentionCount = reports.filter(
    (report) =>
      report.reviewStatus ===
      "needs_attention",
  ).length;

  const uniqueClasses = new Set(
    reports.map((report) => report.classId),
  ).size;

  const uniqueSubjects = new Set(
    reports.map((report) => report.subjectId),
  ).size;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Daily Teaching Reports
          </h1>

          <p className="mt-2 text-slate-600">
            Review lessons submitted for{" "}
            {formatDisplayDate(selectedDate)}
            {currentSession?.name
              ? ` · ${currentSession.name}`
              : ""}.
          </p>
        </div>

        <Link
          href="/reports/daily-teaching/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          <Plus className="size-5" />
          New Teaching Report
        </Link>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <ReportStat
          label="Lesson Reports"
          value={reports.length}
          icon={ClipboardList}
          tone="neutral"
        />

        <ReportStat
          label="Teachers Submitted"
          value={teachersWhoSubmitted.length}
          icon={UserCheck}
          tone="green"
        />

        <ReportStat
          label="Not Submitted"
          value={teachersWhoHaveNotSubmitted.length}
          icon={UserMinus}
          tone="danger"
        />

        <ReportStat
          label="Completed"
          value={completedCount}
          icon={CheckCircle2}
          tone="green"
        />

        <ReportStat
          label="Partial"
          value={partialCount}
          icon={Clock3}
          tone="amber"
        />

        <ReportStat
          label="Postponed"
          value={postponedCount}
          icon={XCircle}
          tone="danger"
        />
      </section>

      <section className="grid gap-5 sm:grid-cols-3">
        <ReviewStat
          label="Awaiting Review"
          value={pendingReviewCount}
          description="Reports waiting for attention"
          tone="amber"
        />

        <ReviewStat
          label="Reviewed"
          value={reviewedCount}
          description="Reports successfully checked"
          tone="green"
        />

        <ReviewStat
          label="Needs Attention"
          value={needsAttentionCount}
          description="Returned to teachers with feedback"
          tone="red"
        />
      </section>

      <Card>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          <FilterField label="Date">
            <Input
              name="date"
              type="date"
              defaultValue={selectedDate}
            />
          </FilterField>

          <FilterField label="Teacher">
            <Select
              name="teacher"
              defaultValue={selectedTeacherId}
            >
              <option value="">All teachers</option>

              {teachers?.map((teacher) => (
                <option
                  key={teacher.id}
                  value={teacher.id}
                >
                  {teacher.full_name}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Class">
            <Select
              name="class"
              defaultValue={selectedClassId}
            >
              <option value="">All classes</option>

              {classes?.map((schoolClass) => (
                <option
                  key={schoolClass.id}
                  value={schoolClass.id}
                >
                  {schoolClass.name}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Subject">
            <Select
              name="subject"
              defaultValue={selectedSubjectId}
            >
              <option value="">All subjects</option>

              {subjects?.map((subject) => (
                <option
                  key={subject.id}
                  value={subject.id}
                >
                  {subject.name}
                </option>
              ))}
            </Select>
          </FilterField>

          <FilterField label="Lesson Status">
            <Select
              name="status"
              defaultValue={selectedStatus}
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="partially_completed">
                Partially completed
              </option>
              <option value="postponed">Postponed</option>
            </Select>
          </FilterField>

          <FilterField label="Review Status">
            <Select
              name="review"
              defaultValue={selectedReviewStatus}
            >
              <option value="">All reviews</option>
              <option value="pending">
                Pending
              </option>
              <option value="reviewed">
                Reviewed
              </option>
              <option value="needs_attention">
                Needs Attention
              </option>
            </Select>
          </FilterField>

          <FilterField label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

              <Input
                name="search"
                type="search"
                defaultValue={search}
                placeholder="Topic or teacher"
                className="pl-10"
              />
            </div>
          </FilterField>

          <div className="flex gap-3 md:col-span-2 xl:col-span-7 xl:justify-end">
            <button
              type="submit"
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              Apply Filters
            </button>

            <Link
              href={`/reports/daily-teaching?date=${selectedDate}`}
              className="rounded-xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Clear Filters
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Submitted Lessons
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {uniqueClasses} class
            {uniqueClasses === 1 ? "" : "es"} ·{" "}
            {uniqueSubjects} subject
            {uniqueSubjects === 1 ? "" : "s"} ·{" "}
            {reports.length} report
            {reports.length === 1 ? "" : "s"}
          </p>
        </div>

        {reports.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1550px] text-left">
              <thead className="border-b border-slate-200">
                <tr>
                  {[
                    "Teacher",
                    "Class & Subject",
                    "Topic",
                    "Time",
                    "Present",
                    "Lesson Status",
                    "Review Status",
                    "Review / Feedback",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="align-top hover:bg-green-50/30"
                  >
                    <td className="px-5 py-5">
                      <Link
                        href={`/teachers/${report.teacherId}`}
                        className="font-semibold text-slate-900 hover:text-green-700"
                      >
                        {report.teacherName}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500">
                        {report.employeeId}
                      </p>
                    </td>

                    <td className="px-5 py-5">
                      <p className="font-semibold text-slate-900">
                        {report.className}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {report.subjectName} ·{" "}
                        {report.subjectCode}
                      </p>
                    </td>

                    <td className="max-w-sm px-5 py-5">
                      <p className="font-medium leading-6 text-slate-800">
                        {report.topicTaught}
                      </p>

                      {report.notes ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {report.notes}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-5 py-5 text-sm text-slate-600">
                      {formatLessonTime(
                        report.startedAt,
                        report.endedAt,
                      )}
                    </td>

                    <td className="px-5 py-5 text-slate-600">
                      {report.studentsPresent ?? "—"}
                    </td>

                    <td className="px-5 py-5">
                      <Badge
                        variant={getLessonStatusVariant(
                          report.lessonStatus,
                        )}
                      >
                        {formatStatus(
                          report.lessonStatus,
                        )}
                      </Badge>
                    </td>

                    <td className="px-5 py-5">
                      <Badge
                        variant={getReviewStatusVariant(
                          report.reviewStatus,
                        )}
                      >
                        {formatStatus(
                          report.reviewStatus,
                        )}
                      </Badge>

                      {report.reviewedAt ? (
                        <p className="mt-2 text-xs text-slate-400">
                          {formatReviewDate(
                            report.reviewedAt,
                          )}
                        </p>
                      ) : null}
                    </td>

                    <td className="w-[330px] px-5 py-5">
                      <ReviewTeachingReportForm
                        reportId={report.id}
                        existingComment={
                          report.reviewComment
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <BookOpenCheck className="mx-auto size-12 text-slate-400" />

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No teaching reports found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              No reports match the selected filters.
            </p>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-100 text-red-700">
            <UserMinus className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Missing Reports
            </h2>

            <p className="text-sm text-slate-500">
              Teachers with no submission for the selected date
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {teachersWhoHaveNotSubmitted.length ? (
            teachersWhoHaveNotSubmitted.map(
              (teacher) => (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {teacher.full_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {teacher.employee_id}
                    </p>
                  </div>

                  <Link
                    href={`/reports/daily-teaching/new?teacher=${teacher.id}`}
                    className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-800 hover:bg-green-50"
                  >
                    Add Report
                  </Link>
                </div>
              ),
            )
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
              <CheckCircle2 className="size-7" />

              <p className="mt-3 font-semibold">
                All teachers submitted
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function FilterField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function ReportStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
  tone: "green" | "amber" | "danger" | "neutral";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex size-10 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function ReviewStat({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  tone: "green" | "amber" | "red";
}) {
  const styles = {
    green: {
      card: "border-green-200 bg-green-50",
      icon: "bg-green-100 text-green-700",
    },
    amber: {
      card: "border-amber-200 bg-amber-50",
      icon: "bg-amber-100 text-amber-700",
    },
    red: {
      card: "border-red-200 bg-red-50",
      icon: "bg-red-100 text-red-700",
    },
  };

  const Icon =
    tone === "green"
      ? CheckCircle2
      : tone === "amber"
        ? Clock3
        : MessageSquareWarning;

  return (
    <Card className={styles[tone].card}>
      <div className="flex items-center gap-4">
        <div
          className={`flex size-11 items-center justify-center rounded-xl ${styles[tone].icon}`}
        >
          <Icon className="size-5" />
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">
            {label}
          </p>

          <p className="mt-1 text-3xl font-bold text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </Card>
  );
}

function getLessonStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "completed") return "success";

  if (status === "partially_completed") {
    return "warning";
  }

  if (status === "postponed") return "danger";

  return "neutral";
}

function getReviewStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "neutral" {
  if (status === "reviewed") return "success";

  if (status === "pending") return "warning";

  if (status === "needs_attention") {
    return "danger";
  }

  return "neutral";
}

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatLessonTime(
  startedAt: string | null,
  endedAt: string | null,
) {
  if (!startedAt && !endedAt) {
    return "Not recorded";
  }

  if (startedAt && endedAt) {
    return `${formatTime(startedAt)} – ${formatTime(
      endedAt,
    )}`;
  }

  if (startedAt) {
    return `From ${formatTime(startedAt)}`;
  }

  return `Until ${formatTime(endedAt!)}`;
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0,
  );

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function getLagosDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function isValidDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}
