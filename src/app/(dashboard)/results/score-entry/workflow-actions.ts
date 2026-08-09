"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SubmitResultsState = {
  success: boolean;
  message: string | null;
};

export async function submitResultsAction(
  _previousState: SubmitResultsState,
  formData: FormData,
): Promise<SubmitResultsState> {
  try {
    const teacherId = String(
      formData.get("teacherId") ?? "",
    ).trim();

    const classSubjectId = String(
      formData.get("classSubjectId") ?? "",
    ).trim();

    const termId = String(
      formData.get("termId") ?? "",
    ).trim();

    if (!teacherId || !classSubjectId || !termId) {
      return {
        success: false,
        message:
          "Teacher, class subject and term are required.",
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
        "teacher",
      ].includes(role)
    ) {
      return {
        success: false,
        message:
          "Your account cannot submit assessment results.",
      };
    }

    const admin = createAdminClient();

    if (role === "teacher") {
      const {
        data: loggedInTeacher,
        error: loggedInTeacherError,
      } = await admin
        .from("teachers")
        .select("id")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (
        loggedInTeacherError ||
        !loggedInTeacher
      ) {
        return {
          success: false,
          message:
            loggedInTeacherError?.message ??
            "Your teacher account could not be found.",
        };
      }

      if (loggedInTeacher.id !== teacherId) {
        return {
          success: false,
          message:
            "You cannot submit results for another teacher.",
        };
      }
    }

    const {
      data: assessmentSheet,
      error: sheetError,
    } = await admin
      .from("assessment_sheets")
      .select(`
        id,
        status,
        teacher_id,
        class_subject_id,
        term_id,
        class_subjects (
          id,
          class_id,
          academic_session_id
        )
      `)
      .eq("teacher_id", teacherId)
      .eq("class_subject_id", classSubjectId)
      .eq("term_id", termId)
      .maybeSingle();

    if (sheetError || !assessmentSheet) {
      return {
        success: false,
        message:
          sheetError?.message ??
          "Save the scores before submitting the result sheet.",
      };
    }

    if (
      assessmentSheet.status !== "draft" &&
      assessmentSheet.status !== "rejected"
    ) {
      return {
        success: false,
        message: `This result sheet is already ${assessmentSheet.status}.`,
      };
    }

    const classSubjectRelation =
      assessmentSheet.class_subjects;

    const classSubject = Array.isArray(
      classSubjectRelation,
    )
      ? classSubjectRelation[0]
      : classSubjectRelation;

    if (!classSubject) {
      return {
        success: false,
        message:
          "The class-subject record could not be verified.",
      };
    }

    const [
      { data: enrollments, error: enrollmentError },
      { data: components, error: componentError },
      { data: scoreRows, error: scoresError },
      { data: resultRows, error: resultsError },
    ] = await Promise.all([
      admin
        .from("student_enrollments")
        .select("id")
        .eq("class_id", classSubject.class_id)
        .eq(
          "academic_session_id",
          classSubject.academic_session_id,
        )
        .eq("status", "active"),

      admin
        .from("assessment_components")
        .select("id")
        .eq("is_active", true),

      admin
        .from("student_scores")
        .select(`
          id,
          enrollment_id,
          component_id
        `)
        .eq(
          "assessment_sheet_id",
          assessmentSheet.id,
        ),

      admin
        .from("subject_results")
        .select(`
          id,
          enrollment_id,
          total_score,
          grade,
          remark
        `)
        .eq(
          "assessment_sheet_id",
          assessmentSheet.id,
        ),
    ]);

    if (enrollmentError) {
      return {
        success: false,
        message: enrollmentError.message,
      };
    }

    if (componentError) {
      return {
        success: false,
        message: componentError.message,
      };
    }

    if (scoresError) {
      return {
        success: false,
        message: scoresError.message,
      };
    }

    if (resultsError) {
      return {
        success: false,
        message: resultsError.message,
      };
    }

    const enrollmentIds = new Set(
      enrollments?.map((item) => item.id) ?? [],
    );

    const componentIds = new Set(
      components?.map((item) => item.id) ?? [],
    );

    if (enrollmentIds.size === 0) {
      return {
        success: false,
        message:
          "There are no active students in this class.",
      };
    }

    if (componentIds.size === 0) {
      return {
        success: false,
        message:
          "No active assessment components were found.",
      };
    }

    const expectedScoreCount =
      enrollmentIds.size * componentIds.size;

    const validScoreRows =
      scoreRows?.filter(
        (score) =>
          enrollmentIds.has(score.enrollment_id) &&
          componentIds.has(score.component_id),
      ) ?? [];

    if (
      validScoreRows.length !== expectedScoreCount
    ) {
      return {
        success: false,
        message:
          "The score sheet is incomplete. Every active student must have CA, Assignment and Exam scores.",
      };
    }

    const completedResultIds = new Set(
      resultRows
        ?.filter(
          (result) =>
            enrollmentIds.has(result.enrollment_id) &&
            result.grade &&
            result.remark,
        )
        .map((result) => result.enrollment_id) ?? [],
    );

    if (
      completedResultIds.size !== enrollmentIds.size
    ) {
      return {
        success: false,
        message:
          "Some student totals, grades or remarks have not been calculated. Save the scores again before submitting.",
      };
    }

    const {
      data: submittedSheet,
      error: submitError,
    } = await admin
      .from("assessment_sheets")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        approved_at: null,
        approved_by: null,
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assessmentSheet.id)
      .in("status", ["draft", "rejected"])
      .select("id, status")
      .maybeSingle();

    if (submitError || !submittedSheet) {
      return {
        success: false,
        message:
          submitError?.message ??
          "The result sheet could not be submitted.",
      };
    }

    revalidatePath("/results");
    revalidatePath("/results/score-entry");
    revalidatePath("/teacher/scores");
    revalidatePath("/teacher");
    revalidatePath("/results/review");
    revalidatePath(`/teachers/${teacherId}`);
    revalidatePath(
      `/classes/${classSubject.class_id}`,
    );
    revalidatePath("/dashboard/principal");

    return {
      success: true,
      message:
        "Result sheet submitted successfully for review.",
    };
  } catch (error) {
    console.error(
      "Unexpected result submission error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected submission error occurred.",
    };
  }
}
