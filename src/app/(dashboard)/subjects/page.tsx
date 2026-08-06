import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  Eye,
  GraduationCap,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge, Card, Input } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Subjects",
};

type SubjectsPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function SubjectsPage({
  searchParams,
}: SubjectsPageProps) {
  const { search = "" } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("subjects")
    .select(`
      id,
      name,
      code,
      description,
      is_core,
      status,
      created_at,
      class_subjects (
        id,
        class_id,
        academic_session_id,
        is_compulsory
      )
    `)
    .order("name")
    .limit(100);

  if (search.trim()) {
    const value = search.trim();

    query = query.or(
      `name.ilike.%${value}%,code.ilike.%${value}%,description.ilike.%${value}%`,
    );
  }

  const { data: subjects, error } = await query;

  if (error) {
    console.error("Unable to load subjects:", error);
  }

  const totalSubjects = subjects?.length ?? 0;

  const coreSubjects =
    subjects?.filter((subject) => subject.is_core).length ??
    0;

  const assignedSubjects =
    subjects?.filter(
      (subject) =>
        (subject.class_subjects?.length ?? 0) > 0,
    ).length ?? 0;

  const unassignedSubjects =
    totalSubjects - assignedSubjects;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold text-slate-950">
            Subjects Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Manage subjects and their class assignments.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/subjects/assign"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
          >
            <GraduationCap className="size-5" />
            Assign Subjects
          </Link>

          <Link
            href="/subjects/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <Plus className="size-5" />
            Add Subject
          </Link>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SubjectStat
          title="Total Subjects"
          value={String(totalSubjects)}
          description="All subject records"
          icon={BookOpen}
          tone="green"
        />

        <SubjectStat
          title="Core Subjects"
          value={String(coreSubjects)}
          description="Compulsory subjects"
          icon={ShieldCheck}
          tone="amber"
        />

        <SubjectStat
          title="Assigned Subjects"
          value={String(assignedSubjects)}
          description="Assigned to classes"
          icon={GraduationCap}
          tone="green"
        />

        <SubjectStat
          title="Unassigned"
          value={String(unassignedSubjects)}
          description="Need class assignment"
          icon={BookOpen}
          tone="neutral"
        />
      </section>

      <Card>
        <form className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

            <Input
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search by subject name or code..."
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
              href="/subjects"
              className="rounded-xl border border-slate-200 px-6 py-3 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {subjects?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Subject
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Code
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Type
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Class Assignments
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
                {subjects.map((subject) => {
                  const assignmentCount =
                    subject.class_subjects?.length ?? 0;

                  return (
                    <tr
                      key={subject.id}
                      className="transition hover:bg-green-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                            <BookOpen className="size-5" />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {subject.name}
                            </p>

                            <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                              {subject.description ??
                                "No description"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {subject.code}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            subject.is_core
                              ? "warning"
                              : "neutral"
                          }
                        >
                          {subject.is_core
                            ? "Core"
                            : "Elective"}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {assignmentCount === 1
                          ? "1 class"
                          : `${assignmentCount} classes`}
                      </td>

                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            subject.status === "active"
                              ? "success"
                              : "neutral"
                          }
                        >
                          {subject.status}
                        </Badge>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/subjects/${subject.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                        >
                          <Eye className="size-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <BookOpen className="size-7" />
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No subjects found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add the first subject to begin academic setup.
            </p>

            <Link
              href="/subjects/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
            >
              <Plus className="size-5" />
              Add Subject
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function SubjectStat({
  title,
  value,
  description,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof BookOpen;
  tone: "green" | "amber" | "neutral";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">
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
