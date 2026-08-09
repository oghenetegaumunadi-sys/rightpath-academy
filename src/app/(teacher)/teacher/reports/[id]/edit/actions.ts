"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UpdateTeachingReportState = {
  success: boolean;
  message: string | null;
};

const validStatuses = [
  "completed",
  "partially_completed",
  "postponed",
] as const;

export async function updateTeachingReportAction(
  reportId: string,
  _previousState: UpdateTeachingReportState,
  formData: FormData,
): Promise<UpdateTeachingReportState> {
  try {
    const topicTaught = String(
      formData.get("topicTaught") ?? "",
    ).trim();

    const lessonStatus = String(
      formData.get("lessonStatus") ?? "",
    ).trim();

    const startedAt =
      String(
        formData.get("startedAt") ?? "",
      ).trim() || null;

    const endedAt =
      String(
        formData.get("endedAt") ?? "",
      ).trim() || null;

    const studentsPresentRaw = String(
      formData.get("studentsPresent") ?? "",
    ).trim();

    const notes =
      String(
        formData.get("notes") ?? "",
      ).trim() || null;

    if (topicTaught.length < 3) {
      return {
        success: false,
        message: "Enter a clear topic taught.",
      };
    }

    if (
      !validStatuses.includes(
        lessonStatus as
          (typeof validStatuses)[number],
      )
    ) {
      return {
        success: false,
        message: "Select a valid lesson status.",
      };
    }

    if (
      startedAt &&
      endedAt &&
      endedAt <= startedAt
    ) {
      return {
        success: false,
        message:
          "The lesson end time must be later than the start time.",
      };
    }

    let studentsPresent: number | null = null;

    if (studentsPresentRaw !== "") {
      studentsPresent = Number(
        studentsPresentRaw,
      );

      if (
        !Number.isInteger(studentsPresent) ||
        studentsPresent < 0
      ) {
        return {
          success: false,
          message:
            "Students present must be a whole number of zero or more.",
        };
      }
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message:
          "Your session has expired. Please sign in again.",
      };
    }

    const admin = createAdminClient();

    const {
      data: teacher,
      error: teacherError,
    } = await admin
      .from("teachers")
      .select("id")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (teacherError || !teacher) {
      return {
        success: false,
        message:
          teacherError?.message ??
          "Your teacher account could not be found.",
      };
    }

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
      .eq("teacher_id", teacher.id)
      .maybeSingle();

    if (reportError || !report) {
      return {
        success: false,
        message:
          reportError?.message ??
          "Teaching report could not be found.",
      };
    }

    if (
      report.review_status !==
      "needs_attention"
    ) {
      return {
        success: false,
        message:
          "Only reports marked as needing attention can be edited.",
      };
    }

    const {
      error: updateError,
    } = await admin
      .from("daily_teaching_reports")
      .update({
        topic_taught: topicTaught,
        lesson_status: lessonStatus,
        started_at: startedAt,
        ended_at: endedAt,
        students_present: studentsPresent,
        notes,

        review_status: "pending",
        review_comment: null,
        reviewed_by: null,
        reviewed_at: null,

        updated_at:
          new Date().toISOString(),
      })
      .eq("id", report.id);

    if (updateError) {
      return {
        success: false,
        message: updateError.message,
      };
    }

    revalidatePath("/teacher");
    revalidatePath("/teacher/reports");
    revalidatePath("/reports/daily-teaching");

    redirect("/teacher/reports");
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "NEXT_REDIRECT"
    ) {
      throw error;
    }

    console.error(
      "Teaching report update error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}
