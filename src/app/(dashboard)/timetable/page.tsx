import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Clock3,
  GraduationCap,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { TimetableCellForm } from "./timetable-cell-form";

export const metadata: Metadata = {
  title: "School Timetable",
};

type PageProps = {
  searchParams: Promise<{
    class?: string;
  }>;
};

const weekdays = [
  {
    number: 1,
    label: "Monday",
  },
  {
    number: 2,
    label: "Tuesday",
  },
  {
    number: 3,
    label: "Wednesday",
  },
  {
    number: 4,
    label: "Thursday",
  },
  {
    number: 5,
    label: "Friday",
  },
];

export default async function TimetablePage({
  searchParams,
}: PageProps) {
  const {
    class:
      selectedClassId = "",
  } = await searchParams;

  const admin =
    createAdminClient();

  const [
    {
      data: currentSession,
    },
    {
      data: currentTerm,
    },
    {
      data: classes,
    },
    {
      data: periods,
    },
  ] = await Promise.all([
    admin
      .from(
        "academic_sessions",
      )
      .select("id, name")
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

    admin
      .from("school_periods")
      .select(`
        id,
        name,
        period_number,
        starts_at,
        ends_at,
        is_break,
        is_instructional
      `)
      .eq("status", "active")
      .order(
        "period_number",
      ),
  ]);

  const selectedClass =
    classes?.find(
      (item) =>
        item.id ===
        selectedClassId,
    ) ?? null;

  let subjects: {
    id: string;
    subjectName: string;
    subjectCode: string;
    teacherName: string;
  }[] = [];

  let entries: {
    id: string;
    classSubjectId:
      string | null;
    periodId: string;
    weekday: number;
  }[] = [];

  if (
    selectedClass &&
    currentSession &&
    currentTerm
  ) {
    const [
      {
        data:
          classSubjects,
      },
      {
        data:
          timetableEntries,
      },
    ] = await Promise.all([
      admin
        .from("class_subjects")
        .select(`
          id,
          subjects (
            id,
            name,
            code
          ),
          teacher_assignments (
            id,
            teacher_id,
            teachers (
              id,
              full_name,
              status
            )
          )
        `)
        .eq(
          "class_id",
          selectedClass.id,
        )
        .eq(
          "academic_session_id",
          currentSession.id,
        ),

      admin
        .from(
          "timetable_entries",
        )
        .select(`
          id,
          class_subject_id,
          period_id,
          weekday
        `)
        .eq(
          "class_id",
          selectedClass.id,
        )
        .eq(
          "academic_session_id",
          currentSession.id,
        )
        .eq(
          "term_id",
          currentTerm.id,
        ),
    ]);

    subjects =
      classSubjects
        ?.map((row) => {
          const subjectRelation =
            row.subjects;

          const subject =
            Array.isArray(
              subjectRelation,
            )
              ? subjectRelation[0]
              : subjectRelation;

          const assignmentRelation =
            row.teacher_assignments;

          const assignment =
            Array.isArray(
              assignmentRelation,
            )
              ? assignmentRelation[0]
              : assignmentRelation;

          const teacherRelation =
            assignment
              ?.teachers;

          const teacher =
            Array.isArray(
              teacherRelation,
            )
              ? teacherRelation[0]
              : teacherRelation;

          if (
            !subject ||
            !teacher ||
            teacher.status !==
              "active"
          ) {
            return null;
          }

          return {
            id: row.id,
            subjectName:
              subject.name,
            subjectCode:
              subject.code,
            teacherName:
              teacher.full_name,
          };
        })
        .filter(
          (
            item,
          ): item is NonNullable<
            typeof item
          > => Boolean(item),
        )
        .sort((a, b) =>
          a.subjectName.localeCompare(
            b.subjectName,
          ),
        ) ?? [];

    entries =
      timetableEntries?.map(
        (entry) => ({
          id: entry.id,
          classSubjectId:
            entry.class_subject_id,
          periodId:
            entry.period_id,
          weekday:
            entry.weekday,
        }),
      ) ?? [];
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          School Administration
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          School Timetable
        </h1>

        <p className="mt-2 text-slate-600">
          Create and manage the weekly class timetable
          {currentTerm?.name
            ? ` · ${currentTerm.name}`
            : ""}
          {currentSession?.name
            ? ` · ${currentSession.name}`
            : ""}.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-950">
          Select a Class
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {classes?.map(
            (schoolClass) => {
              const active =
                schoolClass.id ===
                selectedClassId;

              const levelRelation =
                schoolClass.school_levels;

              const level =
                Array.isArray(
                  levelRelation,
                )
                  ? levelRelation[0]
                  : levelRelation;

              return (
                <Link
                  key={
                    schoolClass.id
                  }
                  href={`/timetable?class=${schoolClass.id}`}
                  className={[
                    "rounded-2xl border p-5 transition",
                    active
                      ? "border-green-700 bg-green-700 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-900 hover:border-green-300 hover:bg-green-50",
                  ].join(" ")}
                >
                  <GraduationCap className="size-5" />

                  <p className="mt-4 font-semibold">
                    {
                      schoolClass.name
                    }
                  </p>

                  <p
                    className={[
                      "mt-1 text-sm",
                      active
                        ? "text-green-100"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {level?.name ??
                      "School level"}
                  </p>
                </Link>
              );
            },
          )}
        </div>
      </section>

      {selectedClass ? (
        <>
          <Card>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {
                    selectedClass.name
                  }{" "}
                  Weekly Timetable
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Academic lessons run from Period 1 through Period 9.
                </p>
              </div>

              <Badge variant="success">
                Monday – Friday
              </Badge>
            </div>
          </Card>

          {/* Mobile timetable editor */}
          <div className="space-y-6 md:hidden">
            {weekdays.map((day) => (
              <Card
                key={day.number}
                className="overflow-hidden p-0"
              >
                <div className="bg-green-700 px-5 py-4 text-white">
                  <h3 className="font-bold">
                    {day.label}
                  </h3>

                  <p className="mt-1 text-xs text-green-100">
                    Assign subjects to this day&apos;s periods
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {periods?.map(
                    (period) => {
                      if (
                        !period.is_instructional
                      ) {
                        return (
                          <div
                            key={period.id}
                            className={[
                              "px-5 py-4",
                              period.is_break
                                ? "bg-amber-50"
                                : "bg-green-50",
                            ].join(" ")}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {
                                    period.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {formatTime(
                                    period.starts_at,
                                  )}{" "}
                                  –{" "}
                                  {formatTime(
                                    period.ends_at,
                                  )}
                                </p>
                              </div>

                              <Badge variant="neutral">
                                Fixed
                              </Badge>
                            </div>
                          </div>
                        );
                      }

                      const existingEntry =
                        entries.find(
                          (entry) =>
                            entry.periodId ===
                              period.id &&
                            entry.weekday ===
                              day.number,
                        ) ?? null;

                      return (
                        <div
                          key={period.id}
                          className="px-5 py-5"
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {
                                  period.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatTime(
                                  period.starts_at,
                                )}{" "}
                                –{" "}
                                {formatTime(
                                  period.ends_at,
                                )}
                              </p>
                            </div>
                          </div>

                          <TimetableCellForm
                            classId={
                              selectedClass.id
                            }
                            weekday={
                              day.number
                            }
                            periodId={
                              period.id
                            }
                            subjects={
                              subjects
                            }
                            existingEntry={
                              existingEntry
                            }
                          />
                        </div>
                      );
                    },
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop timetable editor */}
          <div className="hidden md:block">
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1450px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="sticky left-0 z-10 bg-slate-50 px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Time
                    </th>

                    {weekdays.map(
                      (day) => (
                        <th
                          key={
                            day.number
                          }
                          className="px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                          {day.label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {periods?.map(
                    (period) => (
                      <tr
                        key={
                          period.id
                        }
                      >
                        <td className="sticky left-0 z-10 min-w-44 bg-white px-4 py-4 align-top">
                          <div className="flex items-start gap-3">
                            <Clock3 className="mt-0.5 size-4 text-green-700" />

                            <div>
                              <p className="font-semibold text-slate-900">
                                {
                                  period.name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatTime(
                                  period.starts_at,
                                )}{" "}
                                –{" "}
                                {formatTime(
                                  period.ends_at,
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {weekdays.map(
                          (day) => {
                            if (
                              !period.is_instructional
                            ) {
                              return (
                                <td
                                  key={
                                    day.number
                                  }
                                  className={[
                                    "px-4 py-4 text-center align-middle",
                                    period.is_break
                                      ? "bg-amber-50"
                                      : "bg-green-50",
                                  ].join(
                                    " ",
                                  )}
                                >
                                  <p className="font-semibold text-slate-800">
                                    {
                                      period.name
                                    }
                                  </p>
                                </td>
                              );
                            }

                            const existingEntry =
                              entries.find(
                                (
                                  entry,
                                ) =>
                                  entry.periodId ===
                                    period.id &&
                                  entry.weekday ===
                                    day.number,
                              ) ??
                              null;

                            return (
                              <td
                                key={
                                  day.number
                                }
                                className="px-4 py-4 align-top"
                              >
                                <TimetableCellForm
                                  classId={
                                    selectedClass.id
                                  }
                                  weekday={
                                    day.number
                                  }
                                  periodId={
                                    period.id
                                  }
                                  subjects={
                                    subjects
                                  }
                                  existingEntry={
                                    existingEntry
                                  }
                                />
                              </td>
                            );
                          },
                        )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          </div>
        </>
      ) : (
        <Card className="border-dashed py-16 text-center">
          <CalendarDays className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            Select a class
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Choose a class above to begin building its weekly timetable.
          </p>
        </Card>
      )}
    </div>
  );
}

function formatTime(
  value: string,
) {
  const [
    hourString,
    minute,
  ] = value.split(":");

  const hour =
    Number(hourString);

  const date =
    new Date();

  date.setHours(
    hour,
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
