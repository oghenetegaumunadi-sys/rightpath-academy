import type { Metadata } from "next";
import {
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { HeadTeacherForm } from "./head-teacher-form";

export const metadata: Metadata = {
  title: "Head Teachers",
};

export default async function HeadTeachersPage() {
  const admin =
    createAdminClient();

  const [
    {
      data: teachers,
    },
    {
      data: levels,
    },
    {
      data: assignments,
    },
  ] = await Promise.all([
    admin
      .from("teachers")
      .select(`
        id,
        full_name,
        employee_id,
        status,
        profile_id
      `)
      .eq("status", "active")
      .not(
        "profile_id",
        "is",
        null,
      )
      .order("full_name"),

    admin
      .from("school_levels")
      .select(`
        id,
        name,
        sort_order
      `)
      .eq("status", "active")
      .order("sort_order"),

    admin
      .from(
        "head_teacher_assignments",
      )
      .select(`
        id,
        status,
        assigned_at,
        teachers (
          id,
          full_name,
          employee_id
        ),
        school_levels (
          id,
          name
        )
      `)
      .eq("status", "active"),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          School Administration
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Head Teachers
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600">
          Assign existing teachers to oversee school sections while retaining their normal teaching responsibilities.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <div className="mb-6 flex items-start gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <ShieldCheck className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Assign Head Teacher
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select an existing teacher and school section.
              </p>
            </div>
          </div>

          <HeadTeacherForm
            teachers={
              teachers?.map(
                (teacher) => ({
                  id:
                    teacher.id,
                  fullName:
                    teacher.full_name,
                  employeeId:
                    teacher.employee_id,
                }),
              ) ?? []
            }
            levels={
              levels?.map(
                (level) => ({
                  id:
                    level.id,
                  name:
                    level.name,
                }),
              ) ?? []
            }
          />
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Current Head Teachers
          </h2>

          <div className="mt-5 space-y-4">
            {assignments?.length ? (
              assignments.map(
                (assignment) => {
                  const teacherRelation =
                    assignment.teachers;

                  const teacher =
                    Array.isArray(
                      teacherRelation,
                    )
                      ? teacherRelation[0]
                      : teacherRelation;

                  const levelRelation =
                    assignment.school_levels;

                  const level =
                    Array.isArray(
                      levelRelation,
                    )
                      ? levelRelation[0]
                      : levelRelation;

                  return (
                    <div
                      key={
                        assignment.id
                      }
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                          <GraduationCap className="size-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {teacher?.full_name ??
                              "Unknown teacher"}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {teacher?.employee_id ??
                              "No Staff ID"}
                          </p>
                        </div>
                      </div>

                      <Badge variant="success">
                        {level?.name ??
                          "School Section"}
                      </Badge>
                    </div>
                  );
                },
              )
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                <ShieldCheck className="mx-auto size-10 text-slate-400" />

                <p className="mt-4 font-semibold text-slate-900">
                  No Head Teachers assigned
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Assign the first Head Teacher using the form.
                </p>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
