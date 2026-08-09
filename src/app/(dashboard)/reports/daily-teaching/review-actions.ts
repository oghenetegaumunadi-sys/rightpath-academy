"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ReviewTeachingReportState = {
  success: boolean;
  message: string | null;
};

const validStatuses = [
  "reviewed",
  "needs_attention",
] as const;

export async function reviewTeachingReportAction(
  _previousState: ReviewTeachingReportState,
  formData: FormData,
): Promise<ReviewTeachingReportState> {
  try {
    const reportId = String(
      formData.get("reportId") ?? "",
    ).trim();

    const reviewStatus = String(
      formData.get("reviewStatus") ?? "",
    ).trim();

    const reviewComment =
      String(
        formData.get("reviewComment") ?? "",
      ).trim() || null;

    if (!reportId) {
      return {
        success: false,
        message: "Teaching report ID is required.",
      };
    }

    if (
      !validStatuses.includes(
        reviewStatus as
          (typeof validStatuses)[number],
      )
    ) {
      return {
        success: false,
        message: "Select a valid review status.",
      };
    }

    if (
      reviewStatus === "needs_attention" &&
      !reviewComment
    ) {
      return {
        success: false,
        message:
          "Add a comment explaining what needs attention.",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return {
        success: false,
        message:
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
        success: false,
        message:
          "Your account cannot review teaching reports.",
      };
    }

    const admin = createAdminClient();

    const {
      data: report,
      error: reportError,
    } = await admin
      .from("daily_teaching_reports")
      .select(`
        id,
        teacher_id,
        review_status
      `)
      .eq("id", reportId)
      .maybeSingle();

    if (reportError || !report) {
      return {
        success: false,
        message:
          reportError?.message ??
          "Teaching report could not be found.",
      };
    }

    const {
      error: updateError,
    } = await admin
      .from("daily_teaching_reports")
      .update({
        review_status: reviewStatus,
        review_comment:
          reviewStatus === "reviewed"
            ? reviewComment
            : reviewComment,
        reviewed_by: user.id,
        reviewed_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", reportId);

    if (updateError) {
      return {
        success: false,
        message: updateError.message,
      };
    }

    revalidatePath(
      "/reports/daily-teaching",
    );
    revalidatePath(
      "/teacher/reports",
    );
    revalidatePath(
      "/dashboard/principal",
    );
    revalidatePath(
      "/teacher",
    );

    return {
      success: true,
      message:
        reviewStatus === "reviewed"
          ? "Teaching report marked as reviewed."
          : "Teaching report returned for attention.",
    };
  } catch (error) {
    console.error(
      "Teaching report review error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected review error occurred.",
    };
  }
}
