"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SaveTimetableState = {
  success: boolean;
  message: string | null;
};

export async function saveTimetableEntryAction(
  _previousState: SaveTimetableState,
  formData: FormData,
): Promise<SaveTimetableState> {
  try {
    const classId = String(
      formData.get("classId") ?? "",
    ).trim();

    const classSubjectId = String(
      formData.get("classSubjectId") ?? "",
    ).trim();

    const periodId = String(
      formData.get("periodId") ?? "",
    ).trim();

    const weekday = Number(
      formData.get("weekday") ?? 0,
    );

    if (
      !classId ||
      !classSubjectId ||
      !periodId ||
      !Number.isInteger(weekday) ||
      weekday < 1 ||
      weekday > 5
    ) {
      return {
        success: false,
        message:
          "Class, subject, weekday and period are required.",
      };
    }

    const supabase =
      await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (
      authError ||
      !user?.email
    ) {
      return {
        success: false,
        message:
          "Your session has expired. Please sign in again.",
      };
    }

    const role =
      await ensureUserRole(
        user.id,
        user.email,
      );

    if (
      !role ||
      ![
        "director",
        "school_admin",

        // Legacy roles during migration
        "principal",
        "admin",
      ].includes(role)
    ) {
      return {
        success: false,
        message:
          "Your account cannot manage the school timetable.",
      };
    }

    const admin =
      createAdminClient();

    const [
      {
        data: currentSession,
        error: sessionError,
      },
      {
        data: currentTerm,
        error: termError,
      },
      {
        data: period,
        error: periodError,
      },
      {
        data: classSubject,
        error: classSubjectError,
      },
    ] = await Promise.all([
      admin
        .from("academic_sessions")
        .select("id")
        .eq("is_current", true)
        .maybeSingle(),

      admin
        .from("terms")
        .select(`
          id,
          academic_session_id
        `)
        .eq("is_current", true)
        .maybeSingle(),

      admin
        .from("school_periods")
        .select(`
          id,
          name,
          is_instructional
        `)
        .eq("id", periodId)
        .eq("status", "active")
        .maybeSingle(),

      admin
        .from("class_subjects")
        .select(`
          id,
          class_id,
          academic_session_id
        `)
        .eq("id", classSubjectId)
        .maybeSingle(),
    ]);

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

    if (
      termError ||
      !currentTerm
    ) {
      return {
        success: false,
        message:
          termError?.message ??
          "No current term is active.",
      };
    }

    if (
      currentTerm.academic_session_id !==
      currentSession.id
    ) {
      return {
        success: false,
        message:
          "The current term does not belong to the current academic session.",
      };
    }

    if (
      periodError ||
      !period
    ) {
      return {
        success: false,
        message:
          periodError?.message ??
          "The selected timetable period is invalid.",
      };
    }

    if (!period.is_instructional) {
      return {
        success: false,
        message:
          `${period.name} is a fixed school activity and cannot receive a subject assignment.`,
      };
    }

    if (
      classSubjectError ||
      !classSubject
    ) {
      return {
        success: false,
        message:
          classSubjectError?.message ??
          "The selected class subject could not be found.",
      };
    }

    if (
      classSubject.class_id !==
        classId ||
      classSubject.academic_session_id !==
        currentSession.id
    ) {
      return {
        success: false,
        message:
          "The selected subject does not belong to this class and academic session.",
      };
    }

    const {
      data: assignment,
      error: assignmentError,
    } = await admin
      .from("teacher_assignments")
      .select(`
        id,
        teacher_id,
        teachers (
          id,
          full_name,
          status
        )
      `)
      .eq(
        "class_subject_id",
        classSubjectId,
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
          "Assign a teacher to this class subject before placing it on the timetable.",
      };
    }

    const teacherRelation =
      assignment.teachers;

    const teacher =
      Array.isArray(
        teacherRelation,
      )
        ? teacherRelation[0]
        : teacherRelation;

    if (
      !teacher ||
      teacher.status !== "active"
    ) {
      return {
        success: false,
        message:
          "The assigned teacher is not active.",
      };
    }

    const {
      error: saveError,
    } = await admin
      .from("timetable_entries")
      .upsert(
        {
          academic_session_id:
            currentSession.id,
          term_id:
            currentTerm.id,
          class_id:
            classId,
          class_subject_id:
            classSubjectId,
          teacher_id:
            assignment.teacher_id,
          period_id:
            periodId,
          weekday,
          created_by:
            user.id,
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "academic_session_id,term_id,class_id,weekday,period_id",
        },
      );

    if (saveError) {
      if (
        saveError.code ===
        "23505"
      ) {
        return {
          success: false,
          message:
            "Timetable conflict: this teacher is already assigned to another class during this period.",
        };
      }

      return {
        success: false,
        message:
          saveError.message,
      };
    }

    revalidatePath(
      "/timetable",
    );

    return {
      success: true,
      message:
        "Timetable entry saved successfully.",
    };
  } catch (error) {
    console.error(
      "Unexpected timetable error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected timetable error occurred.",
    };
  }
}

export async function deleteTimetableEntryAction(
  formData: FormData,
) {
  const entryId = String(
    formData.get("entryId") ?? "",
  ).trim();

  if (!entryId) {
    return;
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return;
  }

  const role =
    await ensureUserRole(
      user.id,
      user.email,
    );

  if (
    !role ||
    ![
      "director",
      "school_admin",
      "principal",
      "admin",
    ].includes(role)
  ) {
    return;
  }

  const admin =
    createAdminClient();

  await admin
    .from("timetable_entries")
    .delete()
    .eq("id", entryId);

  revalidatePath(
    "/timetable",
  );
}
