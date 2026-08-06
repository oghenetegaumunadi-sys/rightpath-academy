"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type CreateTeachingReportState = {
  success: boolean;
  message: string | null;
  reportId: string | null;
};

const allowedStatuses = [
  "completed",
  "partially_completed",
  "postponed",
] as const;

export async function createTeachingReportAction(
  _previousState: CreateTeachingReportState,
  formData: FormData,
): Promise<CreateTeachingReportState> {
  try {
    const teacherId = String(
      formData.get("teacherId") ?? "",
    ).trim();

    const classSubjectId = String(
      formData.get("classSubjectId") ?? "",
    ).trim();

    const reportDate = String(
      formData.get("reportDate") ?? "",
    ).trim();

    const topicTaught = String(
      formData.get("topicTaught") ?? "",
    ).trim();

    const lessonStatus = String(
      formData.get("lessonStatus") ?? "",
    ).trim();

    const startedAt =
      String(formData.get("startedAt") ?? "").trim() ||
      null;

    const endedAt =
      String(formData.get("endedAt") ?? "").trim() ||
      null;

    const studentsPresentValue = String(
      formData.get("studentsPresent") ?? "",
    ).trim();

    const notes =
      String(formData.get("notes") ?? "").trim() ||
      null;

    if (!teacherId || !classSubjectId) {
      return {
        success: false,
        message:
          "Select a teacher and an assigned class subject.",
        reportId: null,
      };
    }

    if (
      !reportDate ||
      Number.isNaN(Date.parse(reportDate))
    ) {
      return {
        success: false,
        message: "Select a valid report date.",
        reportId: null,
      };
    }

    if (topicTaught.length < 3) {
      return {
        success: false,
        message:
          "Enter a clear topic containing at least 3 characters.",
        reportId: null,
      };
    }

    if (
      !allowedStatuses.includes(
        lessonStatus as (typeof allowedStatuses)[number],
      )
    ) {
      return {
        success: false,
        message: "Select a valid lesson status.",
        reportId: null,
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
        reportId: null,
      };
    }

    let studentsPresent: number | null = null;

    if (studentsPresentValue !== "") {
      studentsPresent = Number(
        studentsPresentValue,
      );

      if (
        !Number.isInteger(studentsPresent) ||
        studentsPresent < 0
      ) {
        return {
          success: false,
          message:
            "Students present must be a whole number of zero or more.",
          reportId: null,
        };
      }
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
        reportId: null,
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
          "Your account cannot submit teaching reports.",
        reportId: null,
      };
    }

    const admin = createAdminClient();

    if (role === "teacher") {
      const {
        data: linkedTeacher,
        error: linkedTeacherError,
      } = await admin
        .from("teachers")
        .select("id, status")
        .eq("profile_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (linkedTeacherError || !linkedTeacher) {
        return {
          success: false,
          message:
            linkedTeacherError?.message ??
            "Your account is not linked to an active teacher record.",
          reportId: null,
        };
      }

      if (linkedTeacher.id !== teacherId) {
        return {
          success: false,
          message:
            "Teachers may only submit reports for their own account.",
          reportId: null,
        };
      }
    }

    const {
      data: assignment,
      error: assignmentError,
    } = await admin
      .from("teacher_assignments")
      .select(`
        id,
        teacher_id,
        class_subject_id,
        class_subjects (
          id,
          academic_session_id
        )
      `)
      .eq("teacher_id", teacherId)
      .eq("class_subject_id", classSubjectId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return {
        success: false,
        message:
          assignmentError?.message ??
          "The selected class subject is not assigned to this teacher.",
        reportId: null,
      };
    }

    const classSubjectRelation =
      assignment.class_subjects;

    const classSubject = Array.isArray(
      classSubjectRelation,
    )
      ? classSubjectRelation[0]
      : classSubjectRelation;

    if (!classSubject) {
      return {
        success: false,
        message:
          "The selected class-subject record is invalid.",
        reportId: null,
      };
    }

    const {
      data: currentSession,
      error: sessionError,
    } = await admin
      .from("academic_sessions")
      .select("id")
      .eq("is_current", true)
      .maybeSingle();

    if (sessionError || !currentSession) {
      return {
        success: false,
        message:
          sessionError?.message ??
          "No current academic session is active.",
        reportId: null,
      };
    }

    if (
      classSubject.academic_session_id !==
      currentSession.id
    ) {
      return {
        success: false,
        message:
          "The selected assignment does not belong to the current academic session.",
        reportId: null,
      };
    }

    const {
      data: report,
      error: insertError,
    } = await admin
      .from("daily_teaching_reports")
      .insert({
        teacher_id: teacherId,
        class_subject_id: classSubjectId,
        report_date: reportDate,
        topic_taught: topicTaught,
        lesson_status: lessonStatus,
        started_at: startedAt,
        ended_at: endedAt,
        students_present: studentsPresent,
        notes,
        submitted_by: user.id,
      })
      .select("id")
      .single();

    if (insertError || !report) {
      return {
        success: false,
        message:
          insertError?.message ??
          "The teaching report could not be saved.",
        reportId: null,
      };
    }

    revalidatePath("/reports");
    revalidatePath("/reports/daily-teaching");
    revalidatePath("/reports/daily-teaching/new");
    revalidatePath("/dashboard/principal");
    revalidatePath(`/teachers/${teacherId}`);

    return {
      success: true,
      message:
        "Daily teaching report submitted successfully.",
      reportId: report.id,
    };
  } catch (error) {
    console.error(
      "Unexpected teaching report error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
      reportId: null,
    };
  }
}
