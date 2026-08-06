import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  FileText,
  GraduationCap,
  Search,
  Users,
} from "lucide-react";

import {
  Badge,
  Card,
  Input,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Report Cards",
};

type ReportCardsPageProps = {
  searchParams: Promise<{
    class?: string;
    search?: string;
  }>;
};

export default async function ReportCardsPage({
  searchParams,
}: ReportCardsPageProps) {
  const {
    class: selectedClassId = "",
    search = "",
  } = await searchParams;

  const admin = createAdminClient();

  const [
    { data: currentTerm },
    { data: classes },
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
      .maybeSingle(),

    admin
      .from("classes")
      .select(`
        id,
        name,
        sort_order
      `)
      .eq("status", "active")
      .order("sort_order"),
  ]);

  const selectedClass =
    classes?.find(
      (schoolClass) =>
        schoolClass.id === selectedClassId,
    ) ?? null;

  let reportCards: {
    termResultId: string;
    studentId: string;
    enrollmentId: string;
    admissionNumber: string;
    fullName: string;
    gender: string;
    totalScore: number;
    averageScore: number;
    attendancePresent: number;
    attendanceAbsent: number;
    attendanceLate: number;
    status: string;
  }[] = [];

  if (currentTerm && selectedClass) {
    const {
      data: termResults,
      error,
    } = await admin
      .from("term_results")
      .select(`
        id,
        enrollment_id,
        total_score,
        average_score,
        attendance_present,
        attendance_absent,
        attendance_late,
        class_position,
        status,
        student_enrollments!inner (
          id,
          class_id,
          student_id,
          students (
            id,
            admission_number,
            surname,
            first_name,
            other_name,
            gender
          )
        )
      `)
      .eq("term_id", currentTerm.id)
      .eq("status", "published")
      .eq(
        "student_enrollments.class_id",
        selectedClass.id,
      );

    if (error) {
      console.error(
        "Unable to load report cards:",
        {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
      );
    }

    reportCards =
      termResults
        ?.map((result) => {
          const enrollmentRelation =
            result.student_enrollments;

          const enrollment = Array.isArray(
            enrollmentRelation,
          )
            ? enrollmentRelation[0]
            : enrollmentRelation;

          const studentRelation =
            enrollment?.students;

          const student = Array.isArray(
            studentRelation,
          )
            ? studentRelation[0]
            : studentRelation;

          if (!enrollment || !student) {
            return null;
          }

          return {
            termResultId: result.id,
            studentId: student.id,
            enrollmentId: enrollment.id,
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
            totalScore: Number(
              result.total_score,
            ),
            averageScore: Number(
              result.average_score,
            ),
            attendancePresent:
              result.attendance_present,
            attendanceAbsent:
              result.attendance_absent,
            attendanceLate:
              result.attendance_late,
            status: result.status,
          };
        })
        .filter(
          (
            card,
          ): card is NonNullable<typeof card> =>
            Boolean(card),
        )
        .filter((card) => {
          const value =
            search.trim().toLowerCase();

          if (!value) {
            return true;
          }

          return (
            card.fullName
              .toLowerCase()
              .includes(value) ||
            card.admissionNumber
              .toLowerCase()
              .includes(value)
          );
        })
        .sort((a, b) =>
          a.fullName.localeCompare(b.fullName),
        ) ?? [];
  }

  const sessionRelation =
    currentTerm?.academic_sessions;

  const currentSession = Array.isArray(
    sessionRelation,
  )
    ? sessionRelation[0]
    : sessionRelation;

  function buildUrl({
    classId,
    searchValue,
  }: {
    classId?: string;
    searchValue?: string;
  }) {
    const params = new URLSearchParams();

    if (classId) {
      params.set("class", classId);
    }

    if (searchValue) {
      params.set("search", searchValue);
    }

    const query = params.toString();

    return query
      ? `/results/report-cards?${query}`
      : "/results/report-cards";
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">
            Report Cards
          </h1>

          <p className="mt-2 text-slate-600">
            Published student reports for{" "}
            {currentTerm?.name ??
              "the current term"}
            {currentSession?.name
              ? ` · ${currentSession.name}`
              : ""}.
          </p>
        </div>

        <Link
          href="/results/publish"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
        >
          <FileText className="size-5" />
          Publish Results
        </Link>
      </section>

      {!currentTerm ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-900">
            No current term is active.
          </p>
        </Card>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-950">
          Select a Class
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {classes?.map((schoolClass) => {
            const active =
              schoolClass.id === selectedClassId;

            return (
              <Link
                key={schoolClass.id}
                href={buildUrl({
                  classId: schoolClass.id,
                  searchValue:
                    search || undefined,
                })}
                className={[
                  "rounded-2xl border p-5 transition",
                  active
                    ? "border-green-600 bg-green-600 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
                ].join(" ")}
              >
                <GraduationCap className="size-6" />

                <p className="mt-4 font-semibold">
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
                  View published reports
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {selectedClass ? (
        <>
          <Card>
            <form className="flex flex-col gap-3 sm:flex-row">
              <input
                type="hidden"
                name="class"
                value={selectedClass.id}
              />

              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

                <Input
                  name="search"
                  type="search"
                  defaultValue={search}
                  placeholder="Search by student name or admission number..."
                  className="pl-12"
                />
              </div>

              <button
                type="submit"
                className="rounded-xl bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
              >
                Search
              </button>

              {search ? (
                <Link
                  href={buildUrl({
                    classId: selectedClass.id,
                  })}
                  className="rounded-xl border border-slate-200 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Clear
                </Link>
              ) : null}
            </form>
          </Card>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-950">
                {selectedClass.name} Report Cards
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {reportCards.length} published report
                {reportCards.length === 1
                  ? ""
                  : "s"}
              </p>
            </div>

            {reportCards.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Student
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Admission Number
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Average
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Attendance
                      </th>

                      <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                        Status
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {reportCards.map((card) => (
                      <tr
                        key={card.termResultId}
                        className="transition hover:bg-green-50/30"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                              <Users className="size-5" />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {card.fullName}
                              </p>

                              <p className="mt-1 text-xs capitalize text-slate-500">
                                {card.gender}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700">
                          {card.admissionNumber}
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-green-700">
                            {card.averageScore.toFixed(2)}%
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {card.attendancePresent} present ·{" "}
                          {card.attendanceAbsent} absent
                        </td>

                        <td className="px-6 py-4">
                          <Badge variant="success">
                            {card.status}
                          </Badge>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/results/report-cards/${card.termResultId}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                          >
                            <Eye className="size-4" />
                            Open Report
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <FileText className="mx-auto size-12 text-slate-400" />

                <h2 className="mt-5 text-lg font-semibold text-slate-900">
                  No published report cards
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Publish the complete class result before
                  report cards become available.
                </p>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card className="border-dashed py-16 text-center">
          <GraduationCap className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-xl font-semibold text-slate-900">
            Select a class
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose a class above to view its published
            report cards.
          </p>
        </Card>
      )}
    </div>
  );
}
