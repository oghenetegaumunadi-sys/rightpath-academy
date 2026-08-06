"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AssignSubjectsState = {
  success: boolean;
  message: string | null;
};

export async function assignSubjectsAction(
  _previousState: AssignSubjectsState,
  formData: FormData,
): Promise<AssignSubjectsState> {
  try {
    const classId = String(
      formData.get("classId") ?? "",
    ).trim();

    const academicSessionId = String(
      formData.get("academicSessionId") ?? "",
    ).trim();

    const subjectIds = [
      ...new Set(
        formData
          .getAll("subjectIds")
          .map((value) => String(value).trim())
          .filter(Boolean),
      ),
    ];

    console.log("Assign subjects submission:", {
      classId,
      academicSessionId,
      subjectIds,
    });

    if (!classId) {
      return {
        success: false,
        message: "No class was selected.",
      };
    }

    if (!academicSessionId) {
      return {
        success: false,
        message: "No academic session was selected.",
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
          "Your account does not have permission to assign subjects.",
      };
    }

    const admin = createAdminClient();

    const [
      { data: schoolClass, error: classError },
      { data: session, error: sessionError },
    ] = await Promise.all([
      admin
        .from("classes")
        .select("id, name")
        .eq("id", classId)
        .maybeSingle(),

      admin
        .from("academic_sessions")
        .select("id, name")
        .eq("id", academicSessionId)
        .maybeSingle(),
    ]);

    if (classError || !schoolClass) {
      console.error("Class validation failed:", classError);

      return {
        success: false,
        message:
          classError?.message ??
          "The selected class does not exist.",
      };
    }

    if (sessionError || !session) {
      console.error(
        "Session validation failed:",
        sessionError,
      );

      return {
        success: false,
        message:
          sessionError?.message ??
          "The selected academic session does not exist.",
      };
    }

    let selectedSubjects: {
      id: string;
      is_core: boolean;
    }[] = [];

    if (subjectIds.length > 0) {
      const {
        data,
        error: subjectsError,
      } = await admin
        .from("subjects")
        .select("id, is_core")
        .in("id", subjectIds)
        .eq("status", "active");

      if (subjectsError) {
        console.error(
          "Subject lookup failed:",
          subjectsError,
        );

        return {
          success: false,
          message: subjectsError.message,
        };
      }

      selectedSubjects = data ?? [];

      if (
        selectedSubjects.length !== subjectIds.length
      ) {
        return {
          success: false,
          message:
            "One or more selected subjects are invalid or inactive.",
        };
      }
    }

    const { error: deleteError } = await admin
      .from("class_subjects")
      .delete()
      .eq("class_id", classId)
      .eq(
        "academic_session_id",
        academicSessionId,
      );

    if (deleteError) {
      console.error(
        "Class subject cleanup failed:",
        deleteError,
      );

      return {
        success: false,
        message: deleteError.message,
      };
    }

    if (selectedSubjects.length > 0) {
      const rows = selectedSubjects.map(
        (subject) => ({
          class_id: classId,
          subject_id: subject.id,
          academic_session_id:
            academicSessionId,
          is_compulsory: subject.is_core,
        }),
      );

      const {
        data: insertedRows,
        error: insertError,
      } = await admin
        .from("class_subjects")
        .insert(rows)
        .select("id, subject_id");

      if (insertError) {
        console.error(
          "Class subject insert failed:",
          insertError,
        );

        return {
          success: false,
          message: insertError.message,
        };
      }

      if (
        !insertedRows ||
        insertedRows.length !== rows.length
      ) {
        console.error(
          "Unexpected inserted row count:",
          {
            expected: rows.length,
            received: insertedRows?.length ?? 0,
          },
        );

        return {
          success: false,
          message:
            "The assignments could not be verified after saving.",
        };
      }
    }

    const {
      data: savedAssignments,
      error: verificationError,
    } = await admin
      .from("class_subjects")
      .select("id, subject_id")
      .eq("class_id", classId)
      .eq(
        "academic_session_id",
        academicSessionId,
      );

    if (verificationError) {
      console.error(
        "Assignment verification failed:",
        verificationError,
      );

      return {
        success: false,
        message: verificationError.message,
      };
    }

    console.log("Saved class subjects:", {
      className: schoolClass.name,
      sessionName: session.name,
      savedAssignments,
    });

    revalidatePath("/subjects");
    revalidatePath("/subjects/assign");
    revalidatePath("/classes");
    revalidatePath("/teachers");

    return {
      success: true,
      message:
        selectedSubjects.length === 0
          ? `All subjects were removed from ${schoolClass.name}.`
          : `${selectedSubjects.length} subject${
              selectedSubjects.length === 1
                ? ""
                : "s"
            } assigned to ${schoolClass.name}.`,
    };
  } catch (error) {
    console.error(
      "Unexpected subject assignment error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while assigning subjects.",
    };
  }
}
