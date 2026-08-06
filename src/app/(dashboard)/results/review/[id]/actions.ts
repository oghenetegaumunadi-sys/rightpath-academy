"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ReviewResultState = {
  success: boolean;
  message: string | null;
};

async function authorizeReviewer() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return {
      user: null,
      error:
        "Your session has expired. Please sign in again.",
    };
  }

  const role = await ensureUserRole(
    user.id,
    user.email,
  );

  if (
    !role ||
    ![
      "principal",
      "vice_principal",
      "admin",
    ].includes(role)
  ) {
    return {
      user: null,
      error:
        "Your account cannot review assessment results.",
    };
  }

  return {
    user,
    error: null,
  };
}

export async function approveResultSheetAction(
  _previousState: ReviewResultState,
  formData: FormData,
): Promise<ReviewResultState> {
  const sheetId = String(
    formData.get("sheetId") ?? "",
  ).trim();

  if (!sheetId) {
    return {
      success: false,
      message: "Invalid result sheet.",
    };
  }

  const authorization = await authorizeReviewer();

  if (!authorization.user) {
    return {
      success: false,
      message: authorization.error,
    };
  }

  const admin = createAdminClient();

  const {
    data: sheet,
    error: sheetError,
  } = await admin
    .from("assessment_sheets")
    .select(`
      id,
      status,
      teacher_id,
      class_subject_id,
      class_subjects (
        class_id
      )
    `)
    .eq("id", sheetId)
    .maybeSingle();

  if (sheetError || !sheet) {
    return {
      success: false,
      message:
        sheetError?.message ??
        "The result sheet does not exist.",
    };
  }

  if (sheet.status !== "submitted") {
    return {
      success: false,
      message:
        "Only submitted result sheets can be approved.",
    };
  }

  const classSubjectRelation =
    sheet.class_subjects;

  const classSubject = Array.isArray(
    classSubjectRelation,
  )
    ? classSubjectRelation[0]
    : classSubjectRelation;

  const {
    count: resultCount,
    error: resultError,
  } = await admin
    .from("subject_results")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("assessment_sheet_id", sheet.id);

  if (resultError) {
    return {
      success: false,
      message: resultError.message,
    };
  }

  if (!resultCount) {
    return {
      success: false,
      message:
        "This result sheet contains no computed student results.",
    };
  }

  const {
    data: approvedSheet,
    error: approvalError,
  } = await admin
    .from("assessment_sheets")
    .update({
      status: "approved",
      approved_by: authorization.user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sheet.id)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();

  if (approvalError || !approvedSheet) {
    return {
      success: false,
      message:
        approvalError?.message ??
        "The result sheet could not be approved.",
    };
  }

  revalidatePath("/results");
  revalidatePath("/results/review");
  revalidatePath(`/results/review/${sheet.id}`);
  revalidatePath("/results/score-entry");
  revalidatePath(`/teachers/${sheet.teacher_id}`);

  if (classSubject?.class_id) {
    revalidatePath(
      `/classes/${classSubject.class_id}`,
    );
  }

  revalidatePath("/dashboard/principal");

  redirect("/results/review");
}

export async function rejectResultSheetAction(
  _previousState: ReviewResultState,
  formData: FormData,
): Promise<ReviewResultState> {
  const sheetId = String(
    formData.get("sheetId") ?? "",
  ).trim();

  const rejectionReason = String(
    formData.get("rejectionReason") ?? "",
  ).trim();

  if (!sheetId) {
    return {
      success: false,
      message: "Invalid result sheet.",
    };
  }

  if (rejectionReason.length < 5) {
    return {
      success: false,
      message:
        "Provide a clear rejection reason containing at least 5 characters.",
    };
  }

  const authorization = await authorizeReviewer();

  if (!authorization.user) {
    return {
      success: false,
      message: authorization.error,
    };
  }

  const admin = createAdminClient();

  const {
    data: sheet,
    error: sheetError,
  } = await admin
    .from("assessment_sheets")
    .select(`
      id,
      status,
      teacher_id,
      class_subjects (
        class_id
      )
    `)
    .eq("id", sheetId)
    .maybeSingle();

  if (sheetError || !sheet) {
    return {
      success: false,
      message:
        sheetError?.message ??
        "The result sheet does not exist.",
    };
  }

  if (sheet.status !== "submitted") {
    return {
      success: false,
      message:
        "Only submitted result sheets can be rejected.",
    };
  }

  const {
    data: rejectedSheet,
    error: rejectionError,
  } = await admin
    .from("assessment_sheets")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason,
      approved_by: null,
      approved_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sheet.id)
    .eq("status", "submitted")
    .select("id")
    .maybeSingle();

  if (rejectionError || !rejectedSheet) {
    return {
      success: false,
      message:
        rejectionError?.message ??
        "The result sheet could not be rejected.",
    };
  }

  const classSubjectRelation =
    sheet.class_subjects;

  const classSubject = Array.isArray(
    classSubjectRelation,
  )
    ? classSubjectRelation[0]
    : classSubjectRelation;

  revalidatePath("/results");
  revalidatePath("/results/review");
  revalidatePath(`/results/review/${sheet.id}`);
  revalidatePath("/results/score-entry");
  revalidatePath(`/teachers/${sheet.teacher_id}`);

  if (classSubject?.class_id) {
    revalidatePath(
      `/classes/${classSubject.class_id}`,
    );
  }

  revalidatePath("/dashboard/principal");

  redirect("/results/review");
}
