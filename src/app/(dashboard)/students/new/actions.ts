"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createClient } from "@/lib/supabase/server";
import {
  initialRegisterStudentState,
  registerStudentSchema,
  type RegisterStudentState,
} from "@/lib/validations";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function registerStudentAction(
  _previousState: RegisterStudentState,
  formData: FormData,
): Promise<RegisterStudentState> {
  const parsed = registerStudentSchema.safeParse({
    surname: getString(formData, "surname"),
    firstName: getString(formData, "firstName"),
    otherName: getString(formData, "otherName"),
    gender: getString(formData, "gender"),
    dateOfBirth: getString(formData, "dateOfBirth"),
    admissionDate: getString(formData, "admissionDate"),
    classId: getString(formData, "classId"),
    academicSessionId: getString(
      formData,
      "academicSessionId",
    ),
    residentialAddress: getString(
      formData,
      "residentialAddress",
    ),
    guardianName: getString(formData, "guardianName"),
    guardianPhone: getString(formData, "guardianPhone"),
    guardianEmail: getString(formData, "guardianEmail"),
    guardianAddress: getString(
      formData,
      "guardianAddress",
    ),
    guardianOccupation: getString(
      formData,
      "guardianOccupation",
    ),
    guardianRelationship: getString(
      formData,
      "guardianRelationship",
    ),
  });

  if (!parsed.success) {
    return {
      ...initialRegisterStudentState,
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return {
      ...initialRegisterStudentState,
      message: "Your session has expired. Please sign in again.",
    };
  }

  try {
    const role = await ensureUserRole(user.id, user.email);

    if (
      !role ||
      !["principal", "vice_principal", "admin"].includes(role)
    ) {
      return {
        ...initialRegisterStudentState,
        message:
          "Your account does not have permission to register students.",
      };
    }
  } catch (error) {
    console.error("Role bootstrap failed:", error);

    return {
      ...initialRegisterStudentState,
      message:
        error instanceof Error
          ? error.message
          : "Unable to verify your account role.",
    };
  }

  const { data: studentId, error } = await supabase.rpc(
    "register_student",
    {
      p_surname: parsed.data.surname,
      p_first_name: parsed.data.firstName,
      p_other_name: parsed.data.otherName ?? "",
      p_gender: parsed.data.gender,
      p_date_of_birth: parsed.data.dateOfBirth,
      p_admission_date: parsed.data.admissionDate,
      p_class_id: parsed.data.classId,
      p_academic_session_id:
        parsed.data.academicSessionId,
      p_residential_address:
        parsed.data.residentialAddress ?? "",
      p_guardian_name: parsed.data.guardianName,
      p_guardian_phone: parsed.data.guardianPhone,
      p_guardian_email: parsed.data.guardianEmail ?? "",
      p_guardian_address: parsed.data.guardianAddress,
      p_guardian_occupation:
        parsed.data.guardianOccupation ?? "",
      p_guardian_relationship:
        parsed.data.guardianRelationship,
    },
  );

  if (error) {
    console.error("Student registration failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return {
      ...initialRegisterStudentState,
      message:
        error.message ||
        "Student registration failed. Please try again.",
    };
  }

  revalidatePath("/students");
  revalidatePath("/dashboard/principal");

  return {
    success: true,
    message: "Student registered successfully.",
    studentId: studentId ? String(studentId) : null,
    errors: {},
  };
}
