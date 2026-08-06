"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UploadStudentPhotoState = {
  success: boolean;
  message: string | null;
  url: string | null;
};

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function sanitizeAdmissionNumber(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

export async function uploadStudentPhotoAction(
  _previousState: UploadStudentPhotoState,
  formData: FormData,
): Promise<UploadStudentPhotoState> {
  const studentId = String(formData.get("studentId") ?? "");
  const file = formData.get("photo");

  if (!studentId) {
    return {
      success: false,
      message: "Invalid student record.",
      url: null,
    };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      message: "Select a passport photograph.",
      url: null,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      message: "Use a JPG, PNG or WebP image.",
      url: null,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      message: "The image must not exceed 5 MB.",
      url: null,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      success: false,
      message: "Your session has expired. Please sign in again.",
      url: null,
    };
  }

  const role = await ensureUserRole(user.id, user.email);

  if (
    !role ||
    !["principal", "vice_principal", "admin"].includes(role)
  ) {
    return {
      success: false,
      message: "You do not have permission to upload student photos.",
      url: null,
    };
  }

  const admin = createAdminClient();

  const { data: student, error: studentError } = await admin
    .from("students")
    .select("id, admission_number, passport_url")
    .eq("id", studentId)
    .single();

  if (studentError || !student) {
    return {
      success: false,
      message: studentError?.message ?? "Student record not found.",
      url: null,
    };
  }

  const extension =
    file.name.split(".").pop()?.toLowerCase() ||
    file.type.split("/")[1] ||
    "jpg";

  const safeAdmissionNumber = sanitizeAdmissionNumber(
    student.admission_number,
  );

  const filePath =
    `${student.id}/${safeAdmissionNumber}-${Date.now()}.${extension}`;

  const fileBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from("student-passports")
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Photo upload failed:", uploadError);

    return {
      success: false,
      message: uploadError.message,
      url: null,
    };
  }

  const {
    data: { publicUrl },
  } = admin.storage
    .from("student-passports")
    .getPublicUrl(filePath);

  const { error: updateError } = await admin
    .from("students")
    .update({
      passport_url: publicUrl,
    })
    .eq("id", studentId);

  if (updateError) {
    await admin.storage
      .from("student-passports")
      .remove([filePath]);

    return {
      success: false,
      message: updateError.message,
      url: null,
    };
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath(`/students/${studentId}/edit`);

  return {
    success: true,
    message: "Passport photograph uploaded successfully.",
    url: publicUrl,
  };
}
