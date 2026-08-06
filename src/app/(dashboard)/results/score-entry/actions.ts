"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SaveScoresState = {
  success: boolean;
  message: string | null;
  savedCount: number;
};

type ScoreInput = {
  enrollmentId: string;
  componentId: string;
  rawScore: number;
  maximumScore: number;
  weightPercentage: number;
};

function getGrade(total: number) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";

  return "F";
}

function getRemark(total: number) {
  if (total >= 85) return "Excellent";
  if (total >= 70) return "Very Good";
  if (total >= 60) return "Good";
  if (total >= 50) return "Credit";
  if (total >= 45) return "Pass";
  if (total >= 40) return "Fair";

  return "Needs Improvement";
}

export async function saveScoresAction(
  _previousState: SaveScoresState,
  formData: FormData,
): Promise<SaveScoresState> {
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

    const enrollmentIds = [
      ...new Set(
        formData
          .getAll("enrollmentIds")
          .map(String)
          .filter(Boolean),
      ),
    ];

    if (!teacherId || !classSubjectId || !termId) {
      return {
        success: false,
        message:
          "Teacher, class subject and term are required.",
        savedCount: 0,
      };
    }

    if (enrollmentIds.length === 0) {
      return {
        success: false,
        message:
          "No students are available for score entry.",
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
          "Your account cannot enter assessment scores.",
        savedCount: 0,
      };
    }

    const admin = createAdminClient();

    const [
      { data: assignment, error: assignmentError },
      { data: term, error: termError },
      { data: components, error: componentsError },
      { data: existingSheet, error: existingSheetError },
    ] = await Promise.all([
      admin
        .from("teacher_assignments")
        .select(`
          id,
          teacher_id,
          class_subject_id,
          class_subjects (
            id,
            class_id,
            academic_session_id
          )
        `)
        .eq("teacher_id", teacherId)
        .eq("class_subject_id", classSubjectId)
        .maybeSingle(),

      admin
        .from("terms")
        .select(`
          id,
          academic_session_id,
          status
        `)
        .eq("id", termId)
        .maybeSingle(),

      admin
        .from("assessment_components")
        .select(`
          id,
          maximum_score,
          weight_percentage
        `)
        .eq("is_active", true)
        .order("sort_order"),

      admin
        .from("assessment_sheets")
        .select("id, status")
        .eq("class_subject_id", classSubjectId)
        .eq("teacher_id", teacherId)
        .eq("term_id", termId)
        .maybeSingle(),
    ]);

    if (assignmentError || !assignment) {
      return {
        success: false,
        message:
          assignmentError?.message ??
          "This teacher is not assigned to the selected subject.",
        savedCount: 0,
      };
    }

    if (termError || !term) {
      return {
        success: false,
        message:
          termError?.message ??
          "The selected term does not exist.",
        savedCount: 0,
      };
    }

    if (componentsError || !components?.length) {
      return {
        success: false,
        message:
          componentsError?.message ??
          "No active assessment components were found.",
        savedCount: 0,
      };
    }

    if (existingSheetError) {
      return {
        success: false,
        message: existingSheetError.message,
        savedCount: 0,
      };
    }

    if (
      existingSheet &&
      ["submitted", "approved", "published"].includes(
        existingSheet.status,
      )
    ) {
      return {
        success: false,
        message: `This result sheet is ${existingSheet.status} and cannot be edited.`,
        savedCount: 0,
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
          "The class-subject record is invalid.",
        savedCount: 0,
      };
    }

    if (
      classSubject.academic_session_id !==
      term.academic_session_id
    ) {
      return {
        success: false,
        message:
          "The selected term and subject belong to different academic sessions.",
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
      .eq("class_id", classSubject.class_id)
      .eq(
        "academic_session_id",
        classSubject.academic_session_id,
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

    const scoreInputs: ScoreInput[] = [];

    for (const enrollmentId of enrollmentIds) {
      for (const component of components) {
        const fieldName =
          `score_${enrollmentId}_${component.id}`;

        const rawValue = String(
          formData.get(fieldName) ?? "",
        ).trim();

        if (rawValue === "") {
          throw new Error(
            "Enter every student's CA, Assignment and Exam scores.",
          );
        }

        const rawScore = Number(rawValue);

        if (
          !Number.isFinite(rawScore) ||
          rawScore < 0 ||
          rawScore > component.maximum_score
        ) {
          throw new Error(
            `Scores must be between 0 and ${component.maximum_score}.`,
          );
        }

        scoreInputs.push({
          enrollmentId,
          componentId: component.id,
          rawScore,
          maximumScore: component.maximum_score,
          weightPercentage:
            component.weight_percentage,
        });
      }
    }

    const {
      data: assessmentSheet,
      error: sheetError,
    } = await admin
      .from("assessment_sheets")
      .upsert(
        {
          class_subject_id: classSubjectId,
          teacher_id: teacherId,
          term_id: termId,
          status: "draft",
          rejection_reason: null,
        },
        {
          onConflict:
            "class_subject_id,teacher_id,term_id",
        },
      )
      .select("id")
      .single();

    if (sheetError || !assessmentSheet) {
      return {
        success: false,
        message:
          sheetError?.message ??
          "Unable to create the assessment sheet.",
        savedCount: 0,
      };
    }

    const scoreRows = scoreInputs.map((score) => ({
      assessment_sheet_id: assessmentSheet.id,
      enrollment_id: score.enrollmentId,
      component_id: score.componentId,
      raw_score: score.rawScore,
      weighted_score:
        score.maximumScore > 0
          ? Number(
              (
                (score.rawScore /
                  score.maximumScore) *
                score.weightPercentage
              ).toFixed(2),
            )
          : 0,
      entered_by: user.id,
      updated_at: new Date().toISOString(),
    }));

    const {
      data: savedScores,
      error: scoresError,
    } = await admin
      .from("student_scores")
      .upsert(scoreRows, {
        onConflict:
          "assessment_sheet_id,enrollment_id,component_id",
      })
      .select("id");

    if (scoresError) {
      console.error("Score save failed:", {
        message: scoresError.message,
        code: scoresError.code,
        details: scoresError.details,
        hint: scoresError.hint,
      });

      return {
        success: false,
        message: scoresError.message,
        savedCount: 0,
      };
    }

    const studentTotals =
      enrollmentIds.map((enrollmentId) => {
        const totalScore = scoreRows
          .filter(
            (score) =>
              score.enrollment_id === enrollmentId,
          )
          .reduce(
            (total, score) =>
              total + Number(score.weighted_score),
            0,
          );

        return {
          enrollmentId,
          totalScore: Number(totalScore.toFixed(2)),
        };
      });

    const resultRows = studentTotals.map(
      (student) => ({
        assessment_sheet_id: assessmentSheet.id,
        enrollment_id: student.enrollmentId,
        total_score: student.totalScore,
        grade: getGrade(student.totalScore),
        remark: getRemark(student.totalScore),
        subject_position: null,
        updated_at: new Date().toISOString(),
      }),
    );

    const {
      data: savedResults,
      error: resultError,
    } = await admin
      .from("subject_results")
      .upsert(resultRows, {
        onConflict:
          "assessment_sheet_id,enrollment_id",
      })
      .select("id");

    if (resultError) {
      console.error("Result computation failed:", {
        message: resultError.message,
        code: resultError.code,
        details: resultError.details,
        hint: resultError.hint,
      });

      return {
        success: false,
        message: resultError.message,
        savedCount: 0,
      };
    }

    revalidatePath("/results");
    revalidatePath("/results/score-entry");
    revalidatePath(`/teachers/${teacherId}`);
    revalidatePath(
      `/classes/${classSubject.class_id}`,
    );

    return {
      success: true,
      message: `Scores and results calculated for ${enrollmentIds.length} student${
        enrollmentIds.length === 1 ? "" : "s"
      }.`,
      savedCount:
        savedResults?.length ??
        savedScores?.length ??
        enrollmentIds.length,
    };
  } catch (error) {
    console.error(
      "Unexpected score-entry error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected score-entry error occurred.",
      savedCount: 0,
    };
  }
}
