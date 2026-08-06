"use client";

import {
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
} from "@/components/ui";

import {
  assignTeacherSubjectsAction,
  type AssignTeacherSubjectsState,
} from "./actions";

type AssignmentOption = {
  id: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  isCompulsory: boolean;
};

type TeacherSubjectFormProps = {
  teacherId: string;
  academicSessionId: string;
  assignments: AssignmentOption[];
  assignedClassSubjectIds: string[];
};

const initialState: AssignTeacherSubjectsState = {
  success: false,
  message: null,
};

export function TeacherSubjectForm({
  teacherId,
  academicSessionId,
  assignments,
  assignedClassSubjectIds,
}: TeacherSubjectFormProps) {
  const router = useRouter();

  const [state, formAction, pending] =
    useActionState(
      assignTeacherSubjectsAction,
      initialState,
    );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      router.refresh();
    } else if (
      !state.success &&
      state.message
    ) {
      toast.error(state.message);
    }
  }, [state, router]);

  const groupedAssignments =
    assignments.reduce<
      Record<string, AssignmentOption[]>
    >((groups, assignment) => {
      groups[assignment.className] ??= [];
      groups[assignment.className].push(
        assignment,
      );

      return groups;
    }, {});

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="teacherId"
        value={teacherId}
      />

      <input
        type="hidden"
        name="academicSessionId"
        value={academicSessionId}
      />

      {Object.entries(
        groupedAssignments,
      ).map(([className, options]) => (
        <Card key={className}>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <BookOpen className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {className}
              </h2>

              <p className="text-sm text-slate-500">
                Select the subjects taught by this
                teacher.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {options.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-green-300 hover:bg-green-50"
              >
                <input
                  type="checkbox"
                  name="classSubjectIds"
                  value={option.id}
                  defaultChecked={
                    assignedClassSubjectIds.includes(
                      option.id,
                    )
                  }
                  className="mt-1 size-5 accent-green-600"
                />

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-slate-900">
                      {option.subjectName}
                    </span>

                    <Badge
                      variant={
                        option.isCompulsory
                          ? "warning"
                          : "neutral"
                      }
                    >
                      {option.isCompulsory
                        ? "Compulsory"
                        : "Elective"}
                    </Badge>
                  </span>

                  <span className="mt-2 block text-sm font-semibold text-green-700">
                    {option.subjectCode}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </Card>
      ))}

      {assignments.length === 0 ? (
        <Card className="border-dashed text-center">
          <BookOpen className="mx-auto size-10 text-slate-400" />

          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            No class subjects available
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Assign subjects to classes before
            assigning them to a teacher.
          </p>
        </Card>
      ) : null}

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            Teacher assignments updated
            successfully.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            pending ||
            assignments.length === 0
          }
          className="min-w-52"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending
            ? "Saving..."
            : "Save Teacher Assignments"}
        </Button>
      </div>
    </form>
  );
}
