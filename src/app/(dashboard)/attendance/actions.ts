"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type AttendanceStatus =
  Database["public"]["Enums"]["attendance_status"];

export type SaveAttendanceState = {
  success: boolean;
  message: string | null;
  savedCount: number;
};

const validStatuses: AttendanceStatus[] = [
  "present",
  "absent",
  "late",
  "excused",
];

export async function saveStudentAttendanceAction(
  _previousState: SaveAttendanceState,
  formData: FormData,
): Promise<SaveAttendanceState> {
  try {
    const classId = String(
      formData.get("classId") ?? "",
    ).trim();

    const attendanceDate = String(
      formData.get("attendanceDate") ?? "",
    ).trim();

    const enrollmentIds = [
      ...new Set(
        formData
          .getAll("enrollmentIds")
          .map((value) => String(value).trim())
          .filter(Boolean),
      ),
    ];

    if (!classId) {
      return {
        success: false,
        message: "Select a class.",
        savedCount: 0,
      };
    }

    if (
      !attendanceDate ||
      Number.isNaN(Date.parse(attendanceDate))
    ) {
      return {
        success: false,
        message: "Select a valid attendance date.",
        savedCount: 0,
      };
    }

    if (enrollmentIds.length === 0) {
      return {
        success: false,
        message:
          "There are no active students in this class.",
        savedCount: 0,
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
        savedCount: 0,
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
          "Your account cannot record attendance.",
        savedCount: 0,
      };
    }

    const admin = createAdminClient();

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
        savedCount: 0,
      };
    }

    const {
      data: validEnrollments,
      error: enrollmentError,
    } = await admin
      .from("student_enrollments")
      .select("id")
      .in("id", enrollmentIds)
      .eq("class_id", classId)
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .eq("status", "active");

    if (enrollmentError) {
      return {
        success: false,
        message: enrollmentError.message,
        savedCount: 0,
      };
    }

    if (
      validEnrollments?.length !==
      enrollmentIds.length
    ) {
      return {
        success: false,
        message:
          "One or more student enrollments are invalid.",
        savedCount: 0,
      };
    }

    const rows = enrollmentIds.map(
      (enrollmentId) => {
        const rawStatus = String(
          formData.get(`status_${enrollmentId}`) ??
            "",
        ) as AttendanceStatus;

        if (!validStatuses.includes(rawStatus)) {
          throw new Error(
            "Every student must have a valid attendance status.",
          );
        }

        const note =
          String(
            formData.get(`note_${enrollmentId}`) ??
              "",
          ).trim() || null;

        return {
          enrollment_id: enrollmentId,
          attendance_date: attendanceDate,
          status: rawStatus,
          note,
          recorded_by: user.id,
          updated_at: new Date().toISOString(),
        };
      },
    );

    const {
      data: savedRows,
      error: saveError,
    } = await admin
      .from("student_attendance")
      .upsert(rows, {
        onConflict:
          "enrollment_id,attendance_date",
      })
      .select("id");

    if (saveError) {
      console.error("Attendance save failed:", {
        message: saveError.message,
        code: saveError.code,
        details: saveError.details,
        hint: saveError.hint,
      });

      return {
        success: false,
        message: saveError.message,
        savedCount: 0,
      };
    }

    revalidatePath("/attendance");
    revalidatePath("/students");
    revalidatePath(`/classes/${classId}`);
    revalidatePath("/dashboard/principal");

    return {
      success: true,
      message: `${savedRows?.length ?? rows.length} attendance record${
        rows.length === 1 ? "" : "s"
      } saved successfully.`,
      savedCount: savedRows?.length ?? rows.length,
    };
  } catch (error) {
    console.error(
      "Unexpected attendance error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected attendance error occurred.",
      savedCount: 0,
    };
  }
}
