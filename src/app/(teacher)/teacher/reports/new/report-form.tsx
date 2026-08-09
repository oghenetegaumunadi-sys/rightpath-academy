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
  submitTeacherReportAction,
  type TeacherReportState,
} from "./actions";

type Assignment = {
  id: string;
  className: string;
  subjectName: string;
  subjectCode: string;
};

const initialState: TeacherReportState = {
  success: false,
  message: null,
};

export function TeacherReportForm({
  assignments,
  defaultDate,
  selectedAssignmentId,
}: {
  assignments: Assignment[];
  defaultDate: string;
  selectedAssignmentId: string;
}) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    submitTeacherReportAction,
    initialState,
  );

  useEffect(() => {
    if (
      state.success &&
      state.message
    ) {
      toast.success(
        state.message,
      );
    } else if (
      !state.success &&
      state.message
    ) {
      toast.error(
        state.message,
      );
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="assignmentId">
          Class and subject
        </Label>

        <Select
          id="assignmentId"
          name="assignmentId"
          defaultValue={
            selectedAssignmentId
          }
          required
        >
          <option
            value=""
            disabled
          >
            Select class and subject
          </option>

          {assignments.map(
            (assignment) => (
              <option
                key={
                  assignment.id
                }
                value={
                  assignment.id
                }
              >
                {
                  assignment.className
                }{" "}
                —{" "}
                {
                  assignment.subjectName
                }{" "}
                (
                {
                  assignment.subjectCode
                }
                )
              </option>
            ),
          )}
        </Select>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="reportDate">
            Report date
          </Label>

          <Input
            id="reportDate"
            name="reportDate"
            type="date"
            defaultValue={
              defaultDate
            }
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

        <div className="md:col-span-2">
          <Label htmlFor="topicTaught">
            Topic taught
          </Label>

          <Input
            id="topicTaught"
            name="topicTaught"
            placeholder="Example: Fractions — addition with unlike denominators"
            minLength={3}
            required
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

        <div className="md:col-span-2">
          <Label htmlFor="notes">
            Notes or challenges
          </Label>

          <Textarea
            id="notes"
            name="notes"
            rows={5}
            placeholder="Optional notes about learner participation, unfinished work, materials, or challenges."
          />
        </div>
      </div>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            Report submitted.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            pending ||
            assignments.length ===
              0
          }
          className="min-w-48"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending
            ? "Submitting..."
            : "Submit Report"}
        </Button>
      </div>
    </form>
  );
}
