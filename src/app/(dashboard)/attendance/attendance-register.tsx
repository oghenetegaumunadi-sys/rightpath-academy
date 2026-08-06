"use client";

import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Save,
  UserCheck,
  UserMinus,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";

import {
  Badge,
  Button,
  Card,
  Input,
  Select,
} from "@/components/ui";
import type { Database } from "@/types/database";

import {
  saveStudentAttendanceAction,
  type SaveAttendanceState,
} from "./actions";

type AttendanceStatus =
  Database["public"]["Enums"]["attendance_status"];

type StudentEnrollment = {
  enrollmentId: string;
  studentId: string;
  admissionNumber: string;
  fullName: string;
  gender: string;
  existingStatus: AttendanceStatus | null;
  existingNote: string;
};

type AttendanceRegisterProps = {
  classId: string;
  className: string;
  attendanceDate: string;
  students: StudentEnrollment[];
};

const initialState: SaveAttendanceState = {
  success: false,
  message: null,
  savedCount: 0,
};

const statusOptions: {
  value: AttendanceStatus;
  label: string;
}[] = [
  {
    value: "present",
    label: "Present",
  },
  {
    value: "absent",
    label: "Absent",
  },
  {
    value: "late",
    label: "Late",
  },
  {
    value: "excused",
    label: "Excused",
  },
];

export function AttendanceRegister({
  classId,
  className,
  attendanceDate,
  students,
}: AttendanceRegisterProps) {
  const initialStatuses = useMemo(
    () =>
      Object.fromEntries(
        students.map((student) => [
          student.enrollmentId,
          student.existingStatus ?? "present",
        ]),
      ) as Record<string, AttendanceStatus>,
    [students],
  );

  const [statuses, setStatuses] =
    useState<Record<string, AttendanceStatus>>(
      initialStatuses,
    );

  const [state, formAction, pending] = useActionState(
    saveStudentAttendanceAction,
    initialState,
  );

  useEffect(() => {
    setStatuses(initialStatuses);
  }, [initialStatuses]);

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const totals = useMemo(() => {
    const values = Object.values(statuses);

    return {
      present: values.filter(
        (status) => status === "present",
      ).length,
      absent: values.filter(
        (status) => status === "absent",
      ).length,
      late: values.filter(
        (status) => status === "late",
      ).length,
      excused: values.filter(
        (status) => status === "excused",
      ).length,
    };
  }, [statuses]);

  function markEveryone(status: AttendanceStatus) {
    setStatuses(
      Object.fromEntries(
        students.map((student) => [
          student.enrollmentId,
          status,
        ]),
      ),
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input
        type="hidden"
        name="classId"
        value={classId}
      />

      <input
        type="hidden"
        name="attendanceDate"
        value={attendanceDate}
      />

      <Card>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              {className} Attendance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {formatDisplayDate(attendanceDate)} ·{" "}
              {students.length} enrolled student
              {students.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() =>
                markEveryone("present")
              }
            >
              <UserCheck className="size-4" />
              Mark All Present
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => markEveryone("absent")}
            >
              <UserMinus className="size-4" />
              Mark All Absent
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AttendanceSummary
            label="Present"
            value={totals.present}
            variant="success"
          />

          <AttendanceSummary
            label="Absent"
            value={totals.absent}
            variant="danger"
          />

          <AttendanceSummary
            label="Late"
            value={totals.late}
            variant="warning"
          />

          <AttendanceSummary
            label="Excused"
            value={totals.excused}
            variant="info"
          />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        {students.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Student
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Admission Number
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Gender
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Attendance Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Note
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr
                    key={student.enrollmentId}
                    className="transition hover:bg-green-50/30"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="hidden"
                        name="enrollmentIds"
                        value={student.enrollmentId}
                      />

                      <p className="font-semibold text-slate-900">
                        {student.fullName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Student record
                      </p>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-700">
                      {student.admissionNumber}
                    </td>

                    <td className="px-6 py-4 capitalize text-slate-600">
                      {student.gender}
                    </td>

                    <td className="px-6 py-4">
                      <Select
                        name={`status_${student.enrollmentId}`}
                        value={
                          statuses[
                            student.enrollmentId
                          ]
                        }
                        onChange={(event) =>
                          setStatuses((current) => ({
                            ...current,
                            [student.enrollmentId]:
                              event.target
                                .value as AttendanceStatus,
                          }))
                        }
                        className="min-w-36"
                      >
                        {statusOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </td>

                    <td className="px-6 py-4">
                      <Input
                        name={`note_${student.enrollmentId}`}
                        defaultValue={
                          student.existingNote
                        }
                        placeholder="Optional note"
                        className="min-w-52"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <UserMinus className="mx-auto size-12 text-slate-400" />

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No active students
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              This class has no active student enrollments
              for the current session.
            </p>
          </div>
        )}
      </Card>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            {state.savedCount} attendance record
            {state.savedCount === 1 ? "" : "s"} saved.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            pending || students.length === 0
          }
          className="min-w-52"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending
            ? "Saving Attendance..."
            : "Save Attendance"}
        </Button>
      </div>
    </form>
  );
}

function AttendanceSummary({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant:
    | "success"
    | "warning"
    | "danger"
    | "info";
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div>
        <p className="text-sm text-slate-500">
          {label}
        </p>

        <p className="mt-1 text-2xl font-semibold text-slate-950">
          {value}
        </p>
      </div>

      <Badge variant={variant}>
        {label === "Late" ? (
          <Clock3 className="mr-1 size-3" />
        ) : null}

        {label}
      </Badge>
    </div>
  );
}

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
