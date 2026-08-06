"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Send,
  Save,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  Input,
} from "@/components/ui";

import {
  saveScoresAction,
  type SaveScoresState,
} from "./actions";
import {
  submitResultsAction,
  type SubmitResultsState,
} from "./workflow-actions";

type Component = {
  id: string;
  name: string;
  code: string;
  maximumScore: number;
};

type Student = {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  fullName: string;
  existingScores: Record<string, number>;
};

type ScoreEntryFormProps = {
  teacherId: string;
  classSubjectId: string;
  termId: string;
  className: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  termName: string;
  components: Component[];
  students: Student[];
  sheetStatus: string | null;
};

const initialState: SaveScoresState = {
  success: false,
  message: null,
  savedCount: 0,
};

const initialSubmitResultsState: SubmitResultsState = {
  success: false,
  message: null,
};

export function ScoreEntryForm({
  teacherId,
  classSubjectId,
  termId,
  className,
  subjectName,
  subjectCode,
  teacherName,
  termName,
  components,
  students,
  sheetStatus,
}: ScoreEntryFormProps) {
  const router = useRouter();

  const initialScores = useMemo(() => {
    const values: Record<string, number | ""> = {};

    for (const student of students) {
      for (const component of components) {
        const key = `${student.enrollmentId}_${component.id}`;

        values[key] =
          student.existingScores[component.id] ?? "";
      }
    }

    return values;
  }, [students, components]);

  const [scores, setScores] =
    useState<Record<string, number | "">>(
      initialScores,
    );

  const [state, formAction, pending] =
    useActionState(
      saveScoresAction,
      initialState,
    );

  const [
    submitState,
    submitFormAction,
    submitting,
  ] = useActionState(
    submitResultsAction,
    initialSubmitResultsState,
  );

  useEffect(() => {
    setScores(initialScores);
  }, [initialScores]);

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      router.refresh();
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  useEffect(() => {
    if (
      submitState.success &&
      submitState.message
    ) {
      toast.success(submitState.message);
      router.refresh();
    } else if (
      !submitState.success &&
      submitState.message
    ) {
      toast.error(submitState.message);
    }
  }, [submitState, router]);

  function updateScore(
    enrollmentId: string,
    componentId: string,
    value: string,
  ) {
    const key = `${enrollmentId}_${componentId}`;

    setScores((current) => ({
      ...current,
      [key]: value === "" ? "" : Number(value),
    }));
  }

  function getTotal(enrollmentId: string) {
    return components.reduce((total, component) => {
      const value =
        scores[
          `${enrollmentId}_${component.id}`
        ];

      return total + (value === "" ? 0 : value);
    }, 0);
  }

  const readOnly =
    sheetStatus === "submitted" ||
    sheetStatus === "approved" ||
    sheetStatus === "published";

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="teacherId"
        value={teacherId}
      />

      <input
        type="hidden"
        name="classSubjectId"
        value={classSubjectId}
      />

      <input
        type="hidden"
        name="termId"
        value={termId}
      />

      <Card>
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold text-slate-950">
                {className} — {subjectName}
              </h2>

              <Badge variant="info">
                {subjectCode}
              </Badge>

              {sheetStatus ? (
                <Badge
                  variant={
                    sheetStatus === "draft"
                      ? "warning"
                      : sheetStatus === "approved" ||
                          sheetStatus === "published"
                        ? "success"
                        : "info"
                  }
                >
                  {sheetStatus}
                </Badge>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {teacherName} · {termName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {components.map((component) => (
              <Badge
                key={component.id}
                variant="neutral"
              >
                {component.name} /{component.maximumScore}
              </Badge>
            ))}

            <Badge variant="success">
              Total /100
            </Badge>
          </div>
        </div>

        {readOnly ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            This assessment sheet is {sheetStatus} and
            cannot currently be edited.
          </div>
        ) : null}
      </Card>

      <Card className="overflow-hidden p-0">
        {students.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Student
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Admission Number
                  </th>

                  {components.map((component) => (
                    <th
                      key={component.id}
                      className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {component.code} /{component.maximumScore}
                    </th>
                  ))}

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Total /100
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Grade
                  </th>

                  <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Remark
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => {
                  const total = getTotal(
                    student.enrollmentId,
                  );

                  return (
                    <tr
                      key={student.enrollmentId}
                      className="transition hover:bg-green-50/30"
                    >
                      <td className="px-5 py-4">
                        <input
                          type="hidden"
                          name="enrollmentIds"
                          value={student.enrollmentId}
                        />

                        <p className="font-semibold text-slate-900">
                          {student.fullName}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm font-medium text-slate-600">
                        {student.admissionNumber}
                      </td>

                      {components.map((component) => {
                        const fieldName =
                          `score_${student.enrollmentId}_${component.id}`;

                        const value =
                          scores[
                            `${student.enrollmentId}_${component.id}`
                          ];

                        return (
                          <td
                            key={component.id}
                            className="px-5 py-4"
                          >
                            <Input
                              name={fieldName}
                              type="number"
                              min="0"
                              max={
                                component.maximumScore
                              }
                              step="0.01"
                              value={value}
                              disabled={readOnly}
                              required
                              onChange={(event) =>
                                updateScore(
                                  student.enrollmentId,
                                  component.id,
                                  event.target.value,
                                )
                              }
                              className="w-28"
                            />
                          </td>
                        );
                      })}

                      <td className="px-5 py-4">
                        <span className="inline-flex min-w-16 justify-center rounded-lg bg-green-100 px-3 py-2 font-bold text-green-800">
                          {total}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            total >= 50
                              ? "success"
                              : total > 0
                                ? "danger"
                                : "neutral"
                          }
                        >
                          {getGrade(total)}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-slate-700">
                          {getRemark(total)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              No students available
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              No active students are enrolled in this class
              for the selected session.
            </p>
          </div>
        )}
      </Card>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            Scores saved successfully.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <Button
          type="submit"
          disabled={
            pending ||
            submitting ||
            readOnly ||
            students.length === 0
          }
          className="min-w-48"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending ? "Saving Scores..." : "Save Scores"}
        </Button>

        <Button
          type="submit"
          variant="outline"
          formAction={submitFormAction}
          disabled={
            pending ||
            submitting ||
            students.length === 0 ||
            sheetStatus === null ||
            !["draft", "rejected"].includes(
              sheetStatus,
            )
          }
          className="min-w-48 border-amber-300 text-amber-800 hover:bg-amber-50"
        >
          {submitting ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}

          {submitting
            ? "Submitting..."
            : sheetStatus === "rejected"
              ? "Resubmit Results"
              : "Submit Results"}
        </Button>
      </div>
    </form>
  );
}

function getGrade(total: number) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  if (total > 0) return "F";

  return "—";
}


function getRemark(total: number) {
  if (total >= 85) return "Excellent";
  if (total >= 70) return "Very Good";
  if (total >= 60) return "Good";
  if (total >= 50) return "Credit";
  if (total >= 45) return "Pass";
  if (total >= 40) return "Fair";
  if (total > 0) return "Needs Improvement";

  return "—";
}
