import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { TeacherSidebar } from "@/components/teacher/teacher-sidebar";
import { TeacherTopbar } from "@/components/teacher/teacher-topbar";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherLayout({
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
    error,
  } = await admin
    .from("teachers")
    .select(`
      id,
      employee_id,
      full_name,
      status
    `)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    error ||
    !teacher ||
    teacher.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TeacherSidebar />

      <div className="min-w-0 lg:pl-72">
        <TeacherTopbar
          teacherName={teacher.full_name}
          employeeId={teacher.employee_id}
        />

        <main className="px-5 py-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
