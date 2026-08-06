"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createClient } from "@/lib/supabase/server";
import {
  initialRegisterTeacherState,
  registerTeacherSchema,
  type RegisterTeacherState,
} from "@/lib/validations";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function registerTeacherAction(
  _previousState: RegisterTeacherState,
  formData: FormData,
): Promise<RegisterTeacherState> {
  const genderValue = getString(formData, "gender");

  const parsed = registerTeacherSchema.safeParse({
    fullName: getString(formData, "fullName"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    gender: genderValue,
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
  });

  if (!parsed.success) {
    return {
      ...initialRegisterTeacherState,
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
      ...initialRegisterTeacherState,
      message: "Your session has expired. Please sign in again.",
    };
  }

  const role = await ensureUserRole(user.id, user.email);

  if (
    !role ||
    !["principal", "vice_principal", "admin"].includes(role)
  ) {
    return {
      ...initialRegisterTeacherState,
      message:
        "Your account does not have permission to register teachers.",
    };
  }

  const { data: teacherId, error } = await supabase.rpc(
    "register_teacher",
    {
      p_full_name: parsed.data.fullName,
      p_phone: parsed.data.phone,
      p_email: parsed.data.email ?? "",
      p_gender: parsed.data.gender,
      p_date_of_birth: parsed.data.dateOfBirth,
      p_employment_date: parsed.data.employmentDate,
      p_qualification: parsed.data.qualification,
      p_specialization:
        parsed.data.specialization ?? "",
      p_address: parsed.data.address ?? "",
    },
  );

  if (error) {
    console.error("Teacher registration failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return {
      ...initialRegisterTeacherState,
      message:
        error.message ||
        "Teacher registration failed. Please try again.",
    };
  }

  revalidatePath("/teachers");
  revalidatePath("/dashboard/principal");

  return {
    success: true,
    message: "Teacher registered successfully.",
    teacherId: teacherId ? String(teacherId) : null,
    errors: {},
  };
}
