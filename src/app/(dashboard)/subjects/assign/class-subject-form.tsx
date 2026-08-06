"use client";

import {
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Badge, Button, Card } from "@/components/ui";

import {
  assignSubjectsAction,
  type AssignSubjectsState,
} from "./actions";

type Subject = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_core: boolean;
};

type ClassSubjectFormProps = {
  classId: string;
  academicSessionId: string;
  subjects: Subject[];
  assignedSubjectIds: string[];
};

const initialState: AssignSubjectsState = {
  success: false,
  message: null,
};

export function ClassSubjectForm({
  classId,
  academicSessionId,
  subjects,
  assignedSubjectIds,
}: ClassSubjectFormProps) {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    assignSubjectsAction,
    initialState,
  );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      router.refresh();
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="classId"
        value={classId}
      />

      <input
        type="hidden"
        name="academicSessionId"
        value={academicSessionId}
      />

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <BookOpen className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Available Subjects
            </h2>

            <p className="text-sm text-slate-500">
              Select every subject taught in this class.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <label
              key={subject.id}
              className="flex cursor-pointer items-start gap-4 rounded-2xl border border-slate-200 p-5 transition hover:border-green-300 hover:bg-green-50"
            >
              <input
                type="checkbox"
                name="subjectIds"
                value={subject.id}
                defaultChecked={assignedSubjectIds.includes(
                  subject.id,
                )}
                className="mt-1 size-5 accent-green-600"
              />

              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-900">
                    {subject.name}
                  </span>

                  <Badge
                    variant={
                      subject.is_core
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {subject.is_core ? "Core" : "Elective"}
                  </Badge>
                </span>

                <span className="mt-2 block text-sm font-medium text-green-700">
                  {subject.code}
                </span>

                <span className="mt-2 block text-sm leading-6 text-slate-500">
                  {subject.description ??
                    "No description provided."}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            Class subjects updated successfully.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="min-w-48"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending ? "Saving..." : "Save Assignments"}
        </Button>
      </div>
    </form>
  );
}
