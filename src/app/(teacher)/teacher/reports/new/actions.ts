"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type TeacherReportState = {
  success: boolean;
  message: string | null;
};

const validStatuses = [
  "completed",
  "partially_completed",
  "postponed",
] as const;

export async function submitTeacherReportAction(
  _previousState: TeacherReportState,
  formData: FormData,
): Promise<TeacherReportState> {
  try {
    const assignmentId = String(
      formData.get("assignmentId") ?? "",
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
      String(
        formData.get("startedAt") ?? "",
      ).trim() || null;

    const endedAt =
      String(
        formData.get("endedAt") ?? "",
      ).trim() || null;

    const studentsPresentRaw =
      String(
        formData.get("studentsPresent") ?? "",
      ).trim();

    const notes =
      String(
        formData.get("notes") ?? "",
      ).trim() || null;

    if (!assignmentId) {
      return {
        success: false,
        message:
          "Select one of your assigned class subjects.",
      };
    }

    if (
      !reportDate ||
      Number.isNaN(
        Date.parse(reportDate),
      )
    ) {
      return {
        success: false,
        message:
          "Select a valid report date.",
      };
    }

    if (topicTaught.length < 3) {
      return {
        success: false,
        message:
          "Enter the topic taught.",
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
        message:
          "Select a valid lesson status.",
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
          "The end time must be later than the start time.",
      };
    }

    let studentsPresent: number | null =
      null;

    if (studentsPresentRaw !== "") {
      studentsPresent = Number(
        studentsPresentRaw,
      );

      if (
        !Number.isInteger(
          studentsPresent,
        ) ||
        studentsPresent < 0
      ) {
        return {
          success: false,
          message:
            "Students present must be a whole number.",
        };
      }
    }

    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      return {
        success: false,
        message:
          "Your session has expired. Please sign in again.",
      };
    }

    const admin =
      createAdminClient();

    const {
      data: teacher,
      error: teacherError,
    } = await admin
      .from("teachers")
      .select("id")
      .eq(
        "profile_id",
        user.id,
      )
      .eq(
        "status",
        "active",
      )
      .maybeSingle();

    if (
      teacherError ||
      !teacher
    ) {
      return {
        success: false,
        message:
          teacherError?.message ??
          "Your teacher account could not be found.",
      };
    }

    const {
      data: currentSession,
      error: sessionError,
    } = await admin
      .from(
        "academic_sessions",
      )
      .select("id")
      .eq(
        "is_current",
        true,
      )
      .order(
        "starts_on",
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

    if (
      sessionError ||
      !currentSession
    ) {
      return {
        success: false,
        message:
          sessionError?.message ??
          "No current academic session is active.",
      };
    }

    const {
      data: assignment,
      error: assignmentError,
    } = await admin
      .from(
        "teacher_assignments",
      )
      .select(`
        id,
        teacher_id,
        class_subject_id,
        class_subjects (
          id,
          academic_session_id
        )
      `)
      .eq(
        "id",
        assignmentId,
      )
      .eq(
        "teacher_id",
        teacher.id,
      )
      .maybeSingle();

    if (
      assignmentError ||
      !assignment
    ) {
      return {
        success: false,
        message:
          assignmentError?.message ??
          "This assignment does not belong to your account.",
      };
    }

    const relation =
      assignment.class_subjects;

    const classSubject =
      Array.isArray(
        relation,
      )
        ? relation[0]
        : relation;

    if (
      !classSubject ||
      classSubject.academic_session_id !==
        currentSession.id
    ) {
      return {
        success: false,
        message:
          "The selected assignment does not belong to the current academic session.",
      };
    }

    const {
      error: insertError,
    } = await admin
      .from(
        "daily_teaching_reports",
      )
      .insert({
        teacher_id:
          teacher.id,
        class_subject_id:
          assignment.class_subject_id,
        report_date:
          reportDate,
        topic_taught:
          topicTaught,
        lesson_status:
          lessonStatus,
        started_at:
          startedAt,
        ended_at:
          endedAt,
        students_present:
          studentsPresent,
        notes,
        submitted_by:
          user.id,
      });

    if (insertError) {
      return {
        success: false,
        message:
          insertError.message,
      };
    }

    revalidatePath(
      "/teacher/reports",
    );
    revalidatePath(
      "/teacher",
    );
    revalidatePath(
      "/reports/daily-teaching",
    );

    return {
      success: true,
      message:
        "Teaching report submitted successfully.",
    };
  } catch (error) {
    console.error(
      "Teacher report submission error:",
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
