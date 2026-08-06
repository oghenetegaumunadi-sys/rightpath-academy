"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  initialUpdateTeacherState,
  updateTeacherSchema,
  type UpdateTeacherState,
} from "@/lib/validations";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function updateTeacherAction(
  _previousState: UpdateTeacherState,
  formData: FormData,
): Promise<UpdateTeacherState> {
  const parsed = updateTeacherSchema.safeParse({
    teacherId: getString(formData, "teacherId"),
    fullName: getString(formData, "fullName"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    gender: getString(formData, "gender"),
    dateOfBirth: getString(formData, "dateOfBirth"),
    employmentDate: getString(
      formData,
      "employmentDate",
    ),
    qualification: getString(
      formData,
      "qualification",
    ),
    specialization: getString(
      formData,
      "specialization",
    ),
    address: getString(formData, "address"),
    status: getString(formData, "status"),
  });

  if (!parsed.success) {
    return {
      ...initialUpdateTeacherState,
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ...initialUpdateTeacherState,
      message: "Your session has expired. Please sign in again.",
    };
  }

  const role = await ensureUserRole(user.id, user.email);

  if (
    !role ||
    !["principal", "vice_principal", "admin"].includes(role)
  ) {
    return {
      ...initialUpdateTeacherState,
      message:
        "Your account does not have permission to edit teachers.",
    };
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("teachers")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      gender: parsed.data.gender,
      date_of_birth: parsed.data.dateOfBirth,
      employment_date: parsed.data.employmentDate,
      qualification: parsed.data.qualification,
      specialization: parsed.data.specialization,
      address: parsed.data.address,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.teacherId);

  if (error) {
    console.error("Teacher update failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return {
      ...initialUpdateTeacherState,
      message: error.message,
    };
  }

  revalidatePath("/teachers");
  revalidatePath(
    `/teachers/${parsed.data.teacherId}`,
  );
  revalidatePath(
    `/teachers/${parsed.data.teacherId}/edit`,
  );
  revalidatePath("/dashboard/principal");

  return {
    success: true,
    message: "Teacher record updated successfully.",
    errors: {},
  };
}
