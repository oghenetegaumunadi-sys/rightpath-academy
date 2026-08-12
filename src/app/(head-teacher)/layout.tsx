import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { HeadTeacherSidebar } from "@/components/head-teacher/head-teacher-sidebar";
import { HeadTeacherTopbar } from "@/components/head-teacher/head-teacher-topbar";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function HeadTeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
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
    !teacher ||
    teacher.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  const {
    data: assignment,
  } = await admin
    .from("head_teacher_assignments")
    .select(`
      id,
      status,
      school_levels (
        id,
        name
      )
    `)
    .eq("teacher_id", teacher.id)
    .eq("status", "active")
    .maybeSingle();

  if (!assignment) {
    redirect("/unauthorized");
  }

  const levelRelation =
    assignment.school_levels;

  const schoolLevel =
    Array.isArray(levelRelation)
      ? levelRelation[0]
      : levelRelation;

  if (!schoolLevel) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <HeadTeacherSidebar />

      <div className="lg:pl-72">
        <HeadTeacherTopbar
          headTeacherName={teacher.full_name}
          sectionName={schoolLevel.name}
        />

        <main className="px-5 py-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
