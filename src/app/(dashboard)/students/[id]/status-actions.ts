"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type StudentStatus = "active" | "archived";

export async function updateStudentStatusAction(
  studentId: string,
  status: StudentStatus,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      success: false,
      message: "Your session has expired.",
    };
  }

  const role = await ensureUserRole(user.id, user.email);

  if (
    !role ||
    !["principal", "vice_principal", "admin"].includes(role)
  ) {
    return {
      success: false,
      message: "You do not have permission to update students.",
    };
  }

  const admin = createAdminClient();

  const { error: studentError } = await admin
    .from("students")
    .update({ status })
    .eq("id", studentId);

  if (studentError) {
    return {
      success: false,
      message: studentError.message,
    };
  }

  const { error: enrollmentError } = await admin
    .from("student_enrollments")
    .update({ status })
    .eq("student_id", studentId)
    .eq("status", status === "archived" ? "active" : "archived");

  if (enrollmentError) {
    return {
      success: false,
      message: enrollmentError.message,
    };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/dashboard/principal");

  return {
    success: true,
    message:
      status === "archived"
        ? "Student archived successfully."
        : "Student restored successfully.",
  };
}
