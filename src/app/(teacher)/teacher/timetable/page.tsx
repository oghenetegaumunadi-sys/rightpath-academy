import type { Metadata } from "next";
import {
  CalendarDays,
  Clock3,
} from "lucide-react";
import { redirect } from "next/navigation";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Timetable",
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

export default async function TeacherTimetablePage() {
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

  const [
    { data: currentSession },
    { data: currentTerm },
    { data: periods },
  ] = await Promise.all([
    admin
      .from("academic_sessions")
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
      .order("period_number"),
  ]);

  let entries: {
    id: string;
    weekday: number;
    periodId: string;
    className: string;
    subjectName: string;
    subjectCode: string;
    room: string | null;
  }[] = [];

  if (
    currentSession &&
    currentTerm &&
    currentTerm.academic_session_id === currentSession.id
  ) {
    const {
      data: rows,
      error,
    } = await admin
      .from("timetable_entries")
      .select(`
        id,
        weekday,
        period_id,
        room,
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
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .eq(
        "term_id",
        currentTerm.id,
      );

    if (error) {
      console.error(
        "Unable to load teacher timetable:",
        error,
      );
    }

    entries =
      rows
        ?.map((row) => {
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
            !schoolClass ||
            !subject
          ) {
            return null;
          }

          return {
            id: row.id,
            weekday: row.weekday,
            periodId: row.period_id,
            className:
              schoolClass.name,
            subjectName:
              subject.name,
            subjectCode:
              subject.code,
            room: row.room,
          };
        })
        .filter(
          (
            item,
          ): item is NonNullable<
            typeof item
          > => Boolean(item),
        ) ?? [];
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Teacher Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          My Timetable
        </h1>

        <p className="mt-2 text-slate-600">
          Weekly teaching schedule for{" "}
          {teacher.full_name}
          {currentTerm?.name
            ? ` · ${currentTerm.name}`
            : ""}
          {currentSession?.name
            ? ` · ${currentSession.name}`
            : ""}.
        </p>
      </section>

      {!currentSession ||
      !currentTerm ? (
        <Card className="border-amber-200 bg-amber-50">
          <p className="font-semibold text-amber-950">
            No active timetable period
          </p>

          <p className="mt-2 text-sm text-amber-800">
            A current academic session and term must be active before
            your timetable can be displayed.
          </p>
        </Card>
      ) : null}

      {/* Mobile timetable */}
      <div className="space-y-6 md:hidden">
        {weekdays.map((day) => {
          const dayEntries =
            entries.filter(
              (entry) =>
                entry.weekday ===
                day.number,
            );

          return (
            <Card
              key={day.number}
              className="overflow-hidden p-0"
            >
              <div className="border-b border-slate-200 bg-green-700 px-5 py-4 text-white">
                <h2 className="font-bold">
                  {day.label}
                </h2>

                <p className="mt-1 text-xs text-green-100">
                  {
                    dayEntries.length
                  }{" "}
                  teaching period
                  {dayEntries.length === 1
                    ? ""
                    : "s"}
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
                              School Activity
                            </Badge>
                          </div>
                        </div>
                      );
                    }

                    const entry =
                      entries.find(
                        (item) =>
                          item.periodId ===
                            period.id &&
                          item.weekday ===
                            day.number,
                      ) ?? null;

                    return (
                      <div
                        key={period.id}
                        className="px-5 py-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <Clock3 className="size-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
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

                              {entry ? (
                                <Badge variant="success">
                                  {
                                    entry.className
                                  }
                                </Badge>
                              ) : null}
                            </div>

                            {entry ? (
                              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
                                <p className="font-semibold text-green-950">
                                  {
                                    entry.subjectName
                                  }
                                </p>

                                <p className="mt-1 text-xs font-semibold text-green-700">
                                  {
                                    entry.subjectCode
                                  }
                                </p>

                                {entry.room ? (
                                  <p className="mt-2 text-xs text-green-800">
                                    Room:{" "}
                                    {
                                      entry.room
                                    }
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-slate-400">
                                No lesson assigned
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Desktop timetable */}
      <div className="hidden md:block">
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1350px] text-left">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50 px-4 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Time
                </th>

                {weekdays.map(
                  (day) => (
                    <th
                      key={day.number}
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
                    key={period.id}
                  >
                    <td className="sticky left-0 z-10 min-w-44 bg-white px-4 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 size-4 text-green-700" />

                        <div>
                          <p className="font-semibold text-slate-900">
                            {period.name}
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
                              key={day.number}
                              className={[
                                "px-4 py-4 text-center align-middle",
                                period.is_break
                                  ? "bg-amber-50"
                                  : "bg-green-50",
                              ].join(" ")}
                            >
                              <p className="font-semibold text-slate-800">
                                {period.name}
                              </p>
                            </td>
                          );
                        }

                        const entry =
                          entries.find(
                            (item) =>
                              item.periodId ===
                                period.id &&
                              item.weekday ===
                                day.number,
                          ) ?? null;

                        return (
                          <td
                            key={day.number}
                            className="px-4 py-4 align-top"
                          >
                            {entry ? (
                              <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-green-950">
                                      {
                                        entry.subjectName
                                      }
                                    </p>

                                    <p className="mt-1 text-xs font-semibold text-green-700">
                                      {
                                        entry.subjectCode
                                      }
                                    </p>
                                  </div>

                                  <Badge variant="success">
                                    {
                                      entry.className
                                    }
                                  </Badge>
                                </div>

                                {entry.room ? (
                                  <p className="mt-3 text-xs text-green-800">
                                    Room:{" "}
                                    {
                                      entry.room
                                    }
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                                <p className="text-xs font-medium text-slate-400">
                                  No lesson assigned
                                </p>
                              </div>
                            )}
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

      {!entries.length ? (
        <Card className="border-dashed py-12 text-center">
          <CalendarDays className="mx-auto size-11 text-slate-400" />

          <h2 className="mt-4 font-semibold text-slate-900">
            No teaching periods assigned
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Your School Administrator has not yet assigned timetable
            periods to your subjects for the current term.
          </p>
        </Card>
      ) : null}
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
