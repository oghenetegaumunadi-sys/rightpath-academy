"use client";

import {
  LoaderCircle,
  RotateCcw,
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
  type UpdateTeachingReportState,
  updateTeachingReportAction,
} from "./actions";

const initialState: UpdateTeachingReportState = {
  success: false,
  message: null,
};

export function EditTeachingReportForm({
  reportId,
  topicTaught,
  lessonStatus,
  startedAt,
  endedAt,
  studentsPresent,
  notes,
}: {
  reportId: string;
  topicTaught: string;
  lessonStatus: string;
  startedAt: string | null;
  endedAt: string | null;
  studentsPresent: number | null;
  notes: string | null;
}) {
  const boundAction =
    updateTeachingReportAction.bind(
      null,
      reportId,
    );

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    boundAction,
    initialState,
  );

  useEffect(() => {
    if (
      !state.success &&
      state.message
    ) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="topicTaught">
          Topic taught
        </Label>

        <Input
          id="topicTaught"
          name="topicTaught"
          defaultValue={topicTaught}
          required
          minLength={3}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="lessonStatus">
            Lesson status
          </Label>

          <Select
            id="lessonStatus"
            name="lessonStatus"
            defaultValue={lessonStatus}
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
            defaultValue={
              studentsPresent ??
              undefined
            }
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
            defaultValue={
              startedAt?.slice(
                0,
                5,
              ) ?? ""
            }
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
            defaultValue={
              endedAt?.slice(
                0,
                5,
              ) ?? ""
            }
          />
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="notes">
            Notes
          </Label>

          <Textarea
            id="notes"
            name="notes"
            rows={5}
            defaultValue={
              notes ?? ""
            }
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="min-w-48"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <RotateCcw className="size-5" />
          )}

          {pending
            ? "Resubmitting..."
            : "Save & Resubmit"}
        </Button>
      </div>
    </form>
  );
}
