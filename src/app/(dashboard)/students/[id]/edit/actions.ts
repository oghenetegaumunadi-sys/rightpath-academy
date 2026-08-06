"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  initialUpdateStudentState,
  updateStudentSchema,
  type UpdateStudentState,
} from "@/lib/validations";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function updateStudentAction(
  _previousState: UpdateStudentState,
  formData: FormData,
): Promise<UpdateStudentState> {
  const parsed = updateStudentSchema.safeParse({
    studentId: getString(formData, "studentId"),
    surname: getString(formData, "surname"),
    firstName: getString(formData, "firstName"),
    otherName: getString(formData, "otherName"),
    gender: getString(formData, "gender"),
    dateOfBirth: getString(formData, "dateOfBirth"),
    admissionDate: getString(formData, "admissionDate"),
    residentialAddress: getString(
      formData,
      "residentialAddress",
    ),
    status: getString(formData, "status"),
    classId: getString(formData, "classId"),
    enrollmentId: getString(formData, "enrollmentId"),
    guardianId: getString(formData, "guardianId"),
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
      ...initialUpdateStudentState,
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
      ...initialUpdateStudentState,
      message: "Your session has expired. Please sign in again.",
    };
  }

  const role = await ensureUserRole(user.id, user.email);

  if (
    !role ||
    !["principal", "vice_principal", "admin"].includes(role)
  ) {
    return {
      ...initialUpdateStudentState,
      message:
        "Your account does not have permission to edit students.",
    };
  }

  const admin = createAdminClient();

  const { error: studentError } = await admin
    .from("students")
    .update({
      surname: parsed.data.surname,
      first_name: parsed.data.firstName,
      other_name: parsed.data.otherName,
      gender: parsed.data.gender,
      date_of_birth: parsed.data.dateOfBirth,
      admission_date: parsed.data.admissionDate,
      residential_address:
        parsed.data.residentialAddress,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.studentId);

  if (studentError) {
    return {
      ...initialUpdateStudentState,
      message: studentError.message,
    };
  }

  const { error: enrollmentError } = await admin
    .from("student_enrollments")
    .update({
      class_id: parsed.data.classId,
      status: parsed.data.status,
    })
    .eq("id", parsed.data.enrollmentId);

  if (enrollmentError) {
    return {
      ...initialUpdateStudentState,
      message: enrollmentError.message,
    };
  }

  const { error: guardianError } = await admin
    .from("parents")
    .update({
      full_name: parsed.data.guardianName,
      phone: parsed.data.guardianPhone,
      email: parsed.data.guardianEmail,
      address: parsed.data.guardianAddress,
      occupation: parsed.data.guardianOccupation,
      relationship: parsed.data.guardianRelationship,
    })
    .eq("id", parsed.data.guardianId);

  if (guardianError) {
    return {
      ...initialUpdateStudentState,
      message: guardianError.message,
    };
  }

  const { error: relationshipError } = await admin
    .from("student_parents")
    .update({
      relationship: parsed.data.guardianRelationship,
    })
    .eq("student_id", parsed.data.studentId)
    .eq("parent_id", parsed.data.guardianId);

  if (relationshipError) {
    return {
      ...initialUpdateStudentState,
      message: relationshipError.message,
    };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${parsed.data.studentId}`);
  revalidatePath(`/students/${parsed.data.studentId}/edit`);

  return {
    success: true,
    message: "Student record updated successfully.",
    errors: {},
  };
}
