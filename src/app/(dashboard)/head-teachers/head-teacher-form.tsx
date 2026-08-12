"use client";

import {
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { toast } from "sonner";

import {
  Button,
  Label,
  Select,
} from "@/components/ui";

import {
  assignHeadTeacherAction,
  type HeadTeacherAssignmentState,
} from "./actions";

type TeacherOption = {
  id: string;
  fullName: string;
  employeeId: string;
};

type LevelOption = {
  id: string;
  name: string;
};

const initialState: HeadTeacherAssignmentState = {
  success: false,
  message: null,
};

export function HeadTeacherForm({
  teachers,
  levels,
}: {
  teachers: TeacherOption[];
  levels: LevelOption[];
}) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    assignHeadTeacherAction,
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
        <Label htmlFor="teacherId">
          Teacher
        </Label>

        <Select
          id="teacherId"
          name="teacherId"
          required
        >
          <option value="">
            Select teacher
          </option>

          {teachers.map(
            (teacher) => (
              <option
                key={teacher.id}
                value={teacher.id}
              >
                {teacher.fullName} ·{" "}
                {teacher.employeeId}
              </option>
            ),
          )}
        </Select>
      </div>

      <div>
        <Label htmlFor="schoolLevelId">
          School Section
        </Label>

        <Select
          id="schoolLevelId"
          name="schoolLevelId"
          required
        >
          <option value="">
            Select school section
          </option>

          {levels.map(
            (level) => (
              <option
                key={level.id}
                value={level.id}
              >
                {level.name}
              </option>
            ),
          )}
        </Select>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="w-full"
      >
        {pending ? (
          <LoaderCircle className="size-5 animate-spin" />
        ) : (
          <ShieldCheck className="size-5" />
        )}

        {pending
          ? "Assigning..."
          : "Assign Head Teacher"}
      </Button>
    </form>
  );
}
