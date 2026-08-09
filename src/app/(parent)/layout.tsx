import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { ParentSidebar } from "@/components/parent/parent-sidebar";
import { ParentTopbar } from "@/components/parent/parent-topbar";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function ParentLayout({
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
    data: parent,
    error,
  } = await admin
    .from("parents")
    .select(`
      id,
      full_name,
      status
    `)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    error ||
    !parent ||
    parent.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <ParentSidebar />

      <div className="min-w-0 lg:pl-72">
        <ParentTopbar
          parentName={parent.full_name}
        />

        <main className="px-5 py-7 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
