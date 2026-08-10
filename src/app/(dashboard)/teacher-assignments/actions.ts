"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AssignTeacherSubjectsState = {
  success: boolean;
  message: string | null;
};

export async function assignTeacherSubjectsAction(
  _previousState: AssignTeacherSubjectsState,
  formData: FormData,
): Promise<AssignTeacherSubjectsState> {
  try {
    const teacherId = String(
      formData.get("teacherId") ?? "",
    ).trim();

    const academicSessionId = String(
      formData.get("academicSessionId") ?? "",
    ).trim();

    const classSubjectIds = [
      ...new Set(
        formData
          .getAll("classSubjectIds")
          .map((value) => String(value).trim())
          .filter(Boolean),
      ),
    ];

    if (!teacherId) {
      return {
        success: false,
        message: "Select a teacher.",
      };
    }

    if (!academicSessionId) {
      return {
        success: false,
        message: "No active academic session was found.",
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
        "director",
        "school_admin",

        // Legacy roles retained during migration
        "principal",
        "vice_principal",
        "admin",
      ].includes(role)
    ) {
      return {
        success: false,
        message:
          "Your account does not have permission to assign teachers.",
      };
    }

    const admin = createAdminClient();

    const [
      { data: teacher, error: teacherError },
      {
        data: sessionClassSubjects,
        error: classSubjectsError,
      },
    ] = await Promise.all([
      admin
        .from("teachers")
        .select("id, full_name, status")
        .eq("id", teacherId)
        .maybeSingle(),

      admin
        .from("class_subjects")
        .select("id")
        .eq(
          "academic_session_id",
          academicSessionId,
        ),
    ]);

    if (teacherError || !teacher) {
      return {
        success: false,
        message:
          teacherError?.message ??
          "The selected teacher does not exist.",
      };
    }

    if (teacher.status !== "active") {
      return {
        success: false,
        message:
          "Only active teachers can receive subject assignments.",
      };
    }

    if (classSubjectsError) {
      return {
        success: false,
        message: classSubjectsError.message,
      };
    }

    const validClassSubjectIds = new Set(
      sessionClassSubjects?.map(
        (item) => item.id,
      ) ?? [],
    );

    const invalidIds = classSubjectIds.filter(
      (id) => !validClassSubjectIds.has(id),
    );

    if (invalidIds.length > 0) {
      return {
        success: false,
        message:
          "One or more selected class subjects are invalid.",
      };
    }

    const sessionAssignmentIds =
      sessionClassSubjects?.map(
        (item) => item.id,
      ) ?? [];

    if (sessionAssignmentIds.length > 0) {
      const { error: deleteError } = await admin
        .from("teacher_assignments")
        .delete()
        .eq("teacher_id", teacherId)
        .in(
          "class_subject_id",
          sessionAssignmentIds,
        );

      if (deleteError) {
        console.error(
          "Teacher assignment cleanup failed:",
          deleteError,
        );

        return {
          success: false,
          message: deleteError.message,
        };
      }
    }

    if (classSubjectIds.length > 0) {
      const rows = classSubjectIds.map(
        (classSubjectId) => ({
          teacher_id: teacherId,
          class_subject_id: classSubjectId,
          assigned_by: user.id,
          is_class_teacher: false,
        }),
      );

      const {
        data: insertedAssignments,
        error: insertError,
      } = await admin
        .from("teacher_assignments")
        .insert(rows)
        .select("id");

      if (insertError) {
        console.error(
          "Teacher assignment insert failed:",
          insertError,
        );

        return {
          success: false,
          message:
            insertError.code === "23505"
              ? "One or more of these assignments already exist."
              : insertError.message,
        };
      }

      if (
        !insertedAssignments ||
        insertedAssignments.length !== rows.length
      ) {
        return {
          success: false,
          message:
            "The assignments could not be verified after saving.",
        };
      }
    }

    revalidatePath("/teachers");
    revalidatePath("/teacher-assignments");
    revalidatePath(`/teachers/${teacherId}`);
    revalidatePath("/subjects");
    revalidatePath("/timetable");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/director");
    revalidatePath("/dashboard/principal");

    return {
      success: true,
      message:
        classSubjectIds.length === 0
          ? `All current-session subject assignments were removed from ${teacher.full_name}.`
          : `${classSubjectIds.length} assignment${
              classSubjectIds.length === 1
                ? ""
                : "s"
            } saved for ${teacher.full_name}.`,
    };
  } catch (error) {
    console.error(
      "Unexpected teacher assignment error:",
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
