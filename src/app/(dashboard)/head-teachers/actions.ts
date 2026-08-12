"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type HeadTeacherAssignmentState = {
  success: boolean;
  message: string | null;
};

export async function assignHeadTeacherAction(
  _previousState: HeadTeacherAssignmentState,
  formData: FormData,
): Promise<HeadTeacherAssignmentState> {
  try {
    const teacherId = String(
      formData.get("teacherId") ?? "",
    ).trim();

    const schoolLevelId = String(
      formData.get("schoolLevelId") ?? "",
    ).trim();

    if (!teacherId || !schoolLevelId) {
      return {
        success: false,
        message:
          "Select a teacher and school section.",
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
          "Your account cannot assign Head Teachers.",
      };
    }

    const admin =
      createAdminClient();

    const [
      {
        data: teacher,
        error: teacherError,
      },
      {
        data: schoolLevel,
        error: levelError,
      },
      {
        data: headTeacherRole,
        error: roleLookupError,
      },
    ] = await Promise.all([
      admin
        .from("teachers")
        .select(`
          id,
          full_name,
          profile_id,
          status
        `)
        .eq("id", teacherId)
        .maybeSingle(),

      admin
        .from("school_levels")
        .select(`
          id,
          name,
          status
        `)
        .eq("id", schoolLevelId)
        .maybeSingle(),

      admin
        .from("roles")
        .select("id")
        .eq(
          "name",
          "head_teacher",
        )
        .single(),
    ]);

    if (
      teacherError ||
      !teacher
    ) {
      return {
        success: false,
        message:
          teacherError?.message ??
          "The selected teacher could not be found.",
      };
    }

    if (
      teacher.status !==
      "active"
    ) {
      return {
        success: false,
        message:
          "Only active teachers can become Head Teachers.",
      };
    }

    if (
      !teacher.profile_id
    ) {
      return {
        success: false,
        message:
          "This teacher does not yet have a portal account.",
      };
    }

    if (
      levelError ||
      !schoolLevel
    ) {
      return {
        success: false,
        message:
          levelError?.message ??
          "The selected school section could not be found.",
      };
    }

    if (
      schoolLevel.status !==
      "active"
    ) {
      return {
        success: false,
        message:
          "Only active school sections can receive a Head Teacher.",
      };
    }

    if (
      roleLookupError ||
      !headTeacherRole
    ) {
      return {
        success: false,
        message:
          roleLookupError?.message ??
          "The Head Teacher role is missing.",
      };
    }

    const {
      data: existingLevelAssignment,
      error:
        existingLevelError,
    } = await admin
      .from(
        "head_teacher_assignments",
      )
      .select(`
        id,
        teacher_id,
        teachers (
          full_name
        )
      `)
      .eq(
        "school_level_id",
        schoolLevelId,
      )
      .maybeSingle();

    if (existingLevelError) {
      return {
        success: false,
        message:
          existingLevelError.message,
      };
    }

    if (
      existingLevelAssignment &&
      existingLevelAssignment.teacher_id !==
        teacher.id
    ) {
      const teacherRelation =
        existingLevelAssignment.teachers;

      const currentHeadTeacher =
        Array.isArray(
          teacherRelation,
        )
          ? teacherRelation[0]
          : teacherRelation;

      return {
        success: false,
        message:
          `${schoolLevel.name} already has ${
            currentHeadTeacher?.full_name ??
            "another teacher"
          } assigned as Head Teacher.`,
      };
    }

    const {
      error: assignmentError,
    } = await admin
      .from(
        "head_teacher_assignments",
      )
      .upsert(
        {
          teacher_id:
            teacher.id,
          school_level_id:
            schoolLevel.id,
          assigned_by:
            user.id,
          status:
            "active",
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict:
            "teacher_id",
        },
      );

    if (assignmentError) {
      return {
        success: false,
        message:
          assignmentError.message,
      };
    }

    const {
      error:
        profileRoleError,
    } = await admin
      .from("profile_roles")
      .upsert(
        {
          profile_id:
            teacher.profile_id,
          role_id:
            headTeacherRole.id,
          assigned_by:
            user.id,
        },
        {
          onConflict:
            "profile_id,role_id",
          ignoreDuplicates: true,
        },
      );

    if (profileRoleError) {
      return {
        success: false,
        message:
          profileRoleError.message,
      };
    }

    revalidatePath(
      "/head-teachers",
    );
    revalidatePath(
      "/teachers",
    );
    revalidatePath(
      `/teachers/${teacher.id}`,
    );
    revalidatePath(
      "/dashboard/admin",
    );
    revalidatePath(
      "/dashboard/director",
    );

    return {
      success: true,
      message:
        `${teacher.full_name} is now Head Teacher for ${schoolLevel.name}.`,
    };
  } catch (error) {
    console.error(
      "Unexpected Head Teacher assignment error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected Head Teacher assignment error occurred.",
    };
  }
}
