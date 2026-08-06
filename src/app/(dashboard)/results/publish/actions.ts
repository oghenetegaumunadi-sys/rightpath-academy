"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PublishClassResultsState = {
  success: boolean;
  message: string | null;
  publishedCount: number;
};

export async function publishClassResultsAction(
  _previousState: PublishClassResultsState,
  formData: FormData,
): Promise<PublishClassResultsState> {
  try {
    const classId = String(
      formData.get("classId") ?? "",
    ).trim();

    const termId = String(
      formData.get("termId") ?? "",
    ).trim();

    if (!classId || !termId) {
      return {
        success: false,
        message: "Class and term are required.",
        publishedCount: 0,
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
        publishedCount: 0,
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
          "Your account cannot publish student results.",
        publishedCount: 0,
      };
    }

    const admin = createAdminClient();

    const [
      { data: term, error: termError },
      { data: schoolClass, error: classError },
    ] = await Promise.all([
      admin
        .from("terms")
        .select(`
          id,
          name,
          academic_session_id,
          starts_on,
          ends_on
        `)
        .eq("id", termId)
        .maybeSingle(),

      admin
        .from("classes")
        .select("id, name")
        .eq("id", classId)
        .maybeSingle(),
    ]);

    if (termError || !term) {
      return {
        success: false,
        message:
          termError?.message ??
          "The selected term does not exist.",
        publishedCount: 0,
      };
    }

    if (classError || !schoolClass) {
      return {
        success: false,
        message:
          classError?.message ??
          "The selected class does not exist.",
        publishedCount: 0,
      };
    }

    const {
      data: classSubjects,
      error: classSubjectsError,
    } = await admin
      .from("class_subjects")
      .select(`
        id,
        subject_id,
        subjects (
          id,
          name,
          code
        )
      `)
      .eq("class_id", classId)
      .eq(
        "academic_session_id",
        term.academic_session_id,
      );

    if (classSubjectsError) {
      return {
        success: false,
        message: classSubjectsError.message,
        publishedCount: 0,
      };
    }

    if (!classSubjects?.length) {
      return {
        success: false,
        message:
          "No subjects are assigned to this class.",
        publishedCount: 0,
      };
    }

    const classSubjectIds = classSubjects.map(
      (item) => item.id,
    );

    const {
      data: approvedSheets,
      error: sheetsError,
    } = await admin
      .from("assessment_sheets")
      .select(`
        id,
        class_subject_id,
        status
      `)
      .in("class_subject_id", classSubjectIds)
      .eq("term_id", term.id)
      .in("status", ["approved", "published"]);

    if (sheetsError) {
      return {
        success: false,
        message: sheetsError.message,
        publishedCount: 0,
      };
    }

    const sheetsByClassSubject = new Map<
      string,
      string[]
    >();

    for (const sheet of approvedSheets ?? []) {
      const sheetIds =
        sheetsByClassSubject.get(
          sheet.class_subject_id,
        ) ?? [];

      sheetIds.push(sheet.id);

      sheetsByClassSubject.set(
        sheet.class_subject_id,
        sheetIds,
      );
    }

    const missingSubjects = classSubjects.filter(
      (classSubject) =>
        !sheetsByClassSubject.has(classSubject.id),
    );

    if (missingSubjects.length > 0) {
      const names = missingSubjects
        .map((classSubject) => {
          const relation = classSubject.subjects;

          const subject = Array.isArray(relation)
            ? relation[0]
            : relation;

          return subject?.name ?? "Unknown subject";
        })
        .join(", ");

      return {
        success: false,
        message:
          `These subjects do not have approved results: ${names}.`,
        publishedCount: 0,
      };
    }

    const duplicateSubjects = classSubjects.filter(
      (classSubject) =>
        (
          sheetsByClassSubject.get(
            classSubject.id,
          ) ?? []
        ).length > 1,
    );

    if (duplicateSubjects.length > 0) {
      return {
        success: false,
        message:
          "One or more subjects have multiple approved result sheets. Resolve the duplicate teacher assignments before publishing.",
        publishedCount: 0,
      };
    }

    const assessmentSheetIds = classSubjects.map(
      (classSubject) =>
        sheetsByClassSubject.get(
          classSubject.id,
        )![0],
    );

    const {
      data: enrollments,
      error: enrollmentError,
    } = await admin
      .from("student_enrollments")
      .select(`
        id,
        student_id,
        students (
          id,
          admission_number,
          surname,
          first_name,
          other_name
        )
      `)
      .eq("class_id", classId)
      .eq(
        "academic_session_id",
        term.academic_session_id,
      )
      .eq("status", "active");

    if (enrollmentError) {
      return {
        success: false,
        message: enrollmentError.message,
        publishedCount: 0,
      };
    }

    if (!enrollments?.length) {
      return {
        success: false,
        message:
          "There are no active students in this class.",
        publishedCount: 0,
      };
    }

    const enrollmentIds = enrollments.map(
      (item) => item.id,
    );

    const [
      { data: subjectResults, error: resultsError },
      { data: attendanceRows, error: attendanceError },
    ] = await Promise.all([
      admin
        .from("subject_results")
        .select(`
          assessment_sheet_id,
          enrollment_id,
          total_score
        `)
        .in(
          "assessment_sheet_id",
          assessmentSheetIds,
        )
        .in("enrollment_id", enrollmentIds),

      admin
        .from("student_attendance")
        .select(`
          enrollment_id,
          status,
          attendance_date
        `)
        .in("enrollment_id", enrollmentIds)
        .gte("attendance_date", term.starts_on)
        .lte("attendance_date", term.ends_on),
    ]);

    if (resultsError) {
      return {
        success: false,
        message: resultsError.message,
        publishedCount: 0,
      };
    }

    if (attendanceError) {
      return {
        success: false,
        message: attendanceError.message,
        publishedCount: 0,
      };
    }

    const expectedResultCount =
      enrollments.length * classSubjects.length;

    if (
      (subjectResults?.length ?? 0) !==
      expectedResultCount
    ) {
      return {
        success: false,
        message:
          "The class result is incomplete. Every active student must have a result for every assigned subject.",
        publishedCount: 0,
      };
    }

    const now = new Date().toISOString();

    const termResultRows = enrollments.map(
      (enrollment) => {
        const studentSubjectResults =
          subjectResults?.filter(
            (result) =>
              result.enrollment_id ===
              enrollment.id,
          ) ?? [];

        const totalScore =
          studentSubjectResults.reduce(
            (total, result) =>
              total + Number(result.total_score),
            0,
          );

        const averageScore =
          studentSubjectResults.length > 0
            ? totalScore /
              studentSubjectResults.length
            : 0;

        const studentAttendance =
          attendanceRows?.filter(
            (row) =>
              row.enrollment_id ===
              enrollment.id,
          ) ?? [];

        return {
          enrollment_id: enrollment.id,
          term_id: term.id,
          total_score: Number(
            totalScore.toFixed(2),
          ),
          average_score: Number(
            averageScore.toFixed(2),
          ),
          attendance_present:
            studentAttendance.filter(
              (row) =>
                row.status === "present",
            ).length,
          attendance_absent:
            studentAttendance.filter(
              (row) =>
                row.status === "absent",
            ).length,
          attendance_late:
            studentAttendance.filter(
              (row) => row.status === "late",
            ).length,
          class_position: null,
          status: "published" as const,
          published_at: now,
          updated_at: now,
        };
      },
    );

    const {
      data: savedTermResults,
      error: termResultsError,
    } = await admin
      .from("term_results")
      .upsert(termResultRows, {
        onConflict: "enrollment_id,term_id",
      })
      .select("id");

    if (termResultsError) {
      console.error(
        "Term result publication failed:",
        {
          message: termResultsError.message,
          code: termResultsError.code,
          details: termResultsError.details,
          hint: termResultsError.hint,
        },
      );

      return {
        success: false,
        message: termResultsError.message,
        publishedCount: 0,
      };
    }

    const { error: sheetUpdateError } =
      await admin
        .from("assessment_sheets")
        .update({
          status: "published",
          updated_at: now,
        })
        .in("id", assessmentSheetIds)
        .in("status", [
          "approved",
          "published",
        ]);

    if (sheetUpdateError) {
      return {
        success: false,
        message: sheetUpdateError.message,
        publishedCount: 0,
      };
    }

    revalidatePath("/results");
    revalidatePath("/results/review");
    revalidatePath("/results/publish");
    revalidatePath("/results/score-entry");
    revalidatePath(`/classes/${classId}`);
    revalidatePath("/students");
    revalidatePath("/dashboard/principal");

    return {
      success: true,
      message:
        `${schoolClass.name} results published successfully for ${enrollments.length} student${
          enrollments.length === 1 ? "" : "s"
        }.`,
      publishedCount:
        savedTermResults?.length ??
        termResultRows.length,
    };
  } catch (error) {
    console.error(
      "Unexpected result publication error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected publication error occurred.",
      publishedCount: 0,
    };
  }
}
