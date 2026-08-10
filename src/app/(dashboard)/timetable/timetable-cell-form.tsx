"use client";

import {
  LoaderCircle,
  Save,
  Trash2,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { toast } from "sonner";

import {
  Button,
  Select,
} from "@/components/ui";

import {
  deleteTimetableEntryAction,
  saveTimetableEntryAction,
  type SaveTimetableState,
} from "./actions";

type SubjectOption = {
  id: string;
  subjectName: string;
  subjectCode: string;
  teacherName: string;
};

type TimetableCellFormProps = {
  classId: string;
  weekday: number;
  periodId: string;
  subjects: SubjectOption[];
  existingEntry:
    | {
        id: string;
        classSubjectId:
          string | null;
      }
    | null;
};

const initialState: SaveTimetableState = {
  success: false,
  message: null,
};

export function TimetableCellForm({
  classId,
  weekday,
  periodId,
  subjects,
  existingEntry,
}: TimetableCellFormProps) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    saveTimetableEntryAction,
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
    <div className="min-w-52">
      <form
        action={formAction}
        className="space-y-2"
      >
        <input
          type="hidden"
          name="classId"
          value={classId}
        />

        <input
          type="hidden"
          name="weekday"
          value={weekday}
        />

        <input
          type="hidden"
          name="periodId"
          value={periodId}
        />

        <Select
          name="classSubjectId"
          defaultValue={
            existingEntry
              ?.classSubjectId ??
            ""
          }
          required
          className="w-full text-xs"
        >
          <option value="">
            Select subject
          </option>

          {subjects.map(
            (subject) => (
              <option
                key={subject.id}
                value={subject.id}
              >
                {subject.subjectCode} ·{" "}
                {subject.subjectName} ·{" "}
                {subject.teacherName}
              </option>
            ),
          )}
        </Select>

        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="w-full"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}

          {existingEntry
            ? "Update"
            : "Assign"}
        </Button>
      </form>

      {existingEntry ? (
        <form
          action={
            deleteTimetableEntryAction
          }
          className="mt-2"
        >
          <input
            type="hidden"
            name="entryId"
            value={
              existingEntry.id
            }
          />

          <Button
            type="submit"
            size="sm"
            variant="outline"
            className="w-full text-red-700"
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        </form>
      ) : null}
    </div>
  );
}
