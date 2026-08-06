"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { toast } from "sonner";

import {
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";

import {
  createTeachingReportAction,
  type CreateTeachingReportState,
} from "./actions";

type AssignmentOption = {
  id: string;
  classSubjectId: string;
  className: string;
  subjectName: string;
  subjectCode: string;
};

type TeachingReportFormProps = {
  teacherId: string;
  teacherName: string;
  assignments: AssignmentOption[];
  defaultDate: string;
};

const initialState: CreateTeachingReportState = {
  success: false,
  message: null,
  reportId: null,
};

export function TeachingReportForm({
  teacherId,
  teacherName,
  assignments,
  defaultDate,
}: TeachingReportFormProps) {
  const [state, formAction, pending] =
    useActionState(
      createTeachingReportAction,
      initialState,
    );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

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

      <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
        <p className="text-sm font-semibold text-green-700">
          Reporting teacher
        </p>

        <p className="mt-1 text-lg font-bold text-green-950">
          {teacherName}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <Label htmlFor="classSubjectId">
            Class and subject
          </Label>

          <Select
            id="classSubjectId"
            name="classSubjectId"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Select an assigned class subject
            </option>

            {assignments.map((assignment) => (
              <option
                key={assignment.id}
                value={assignment.classSubjectId}
              >
                {assignment.className} —{" "}
                {assignment.subjectName} (
                {assignment.subjectCode})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="reportDate">
            Report date
          </Label>

          <Input
            id="reportDate"
            name="reportDate"
            type="date"
            defaultValue={defaultDate}
            required
          />
        </div>

        <div>
          <Label htmlFor="lessonStatus">
            Lesson status
          </Label>

          <Select
            id="lessonStatus"
            name="lessonStatus"
            defaultValue="completed"
            required
          >
            <option value="completed">
              Completed
            </option>

            <option value="partially_completed">
              Partially completed
            </option>

            <option value="postponed">
              Postponed
            </option>
          </Select>
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor="topicTaught">
            Topic taught
          </Label>

          <Input
            id="topicTaught"
            name="topicTaught"
            placeholder="Example: Fractions — addition with unlike denominators"
            required
            minLength={3}
          />
        </div>

        <div>
          <Label htmlFor="startedAt">
            Start time
          </Label>

          <Input
            id="startedAt"
            name="startedAt"
            type="time"
          />
        </div>

        <div>
          <Label htmlFor="endedAt">
            End time
          </Label>

          <Input
            id="endedAt"
            name="endedAt"
            type="time"
          />
        </div>

        <div>
          <Label htmlFor="studentsPresent">
            Students present
          </Label>

          <Input
            id="studentsPresent"
            name="studentsPresent"
            type="number"
            min="0"
            step="1"
            placeholder="Optional"
          />
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor="notes">
            Notes or challenges
          </Label>

          <Textarea
            id="notes"
            name="notes"
            rows={5}
            placeholder="Optional notes about learner participation, unfinished work, teaching materials, or challenges."
          />
        </div>
      </div>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            Report saved successfully.
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
            ? "Submitting Report..."
            : "Submit Teaching Report"}
        </Button>
      </div>
    </form>
  );
}
