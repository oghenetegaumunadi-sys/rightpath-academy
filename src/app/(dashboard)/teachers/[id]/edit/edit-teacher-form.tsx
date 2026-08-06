"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { initialUpdateTeacherState } from "@/lib/validations";

import { updateTeacherAction } from "./actions";

type TeacherData = {
  id: string;
  employeeId: string;
  fullName: string;
  phone: string;
  email: string;
  gender: "male" | "female";
  dateOfBirth: string;
  employmentDate: string;
  qualification: string;
  specialization: string;
  address: string;
  status:
    | "active"
    | "inactive"
    | "suspended"
    | "graduated"
    | "withdrawn"
    | "archived";
};

export function EditTeacherForm({
  teacher,
}: {
  teacher: TeacherData;
}) {
  const [state, formAction, pending] = useActionState(
    updateTeacherAction,
    initialUpdateTeacherState,
  );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction} className="space-y-8">
      <input
        type="hidden"
        name="teacherId"
        value={teacher.id}
      />

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Staff Record
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          The staff ID is generated automatically and cannot be
          edited.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="employeeId">
              Staff ID
            </Label>

            <Input
              id="employeeId"
              value={teacher.employeeId}
              readOnly
              className="cursor-not-allowed border-amber-200 bg-amber-50 font-semibold text-amber-800"
            />
          </div>

          <div>
            <Label htmlFor="status">
              Employment status
            </Label>

            <Select
              id="status"
              name="status"
              defaultValue={teacher.status}
              error={Boolean(
                state.errors.status?.length,
              )}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">
                Suspended
              </option>
              <option value="archived">Archived</option>
            </Select>

            <FieldError messages={state.errors.status} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Personal Information
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="fullName">
              Full name
            </Label>

            <Input
              id="fullName"
              name="fullName"
              defaultValue={teacher.fullName}
              required
              error={Boolean(
                state.errors.fullName?.length,
              )}
            />

            <FieldError
              messages={state.errors.fullName}
            />
          </div>

          <div>
            <Label htmlFor="phone">
              Phone number
            </Label>

            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={teacher.phone}
              required
              error={Boolean(
                state.errors.phone?.length,
              )}
            />

            <FieldError messages={state.errors.phone} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={teacher.email}
              error={Boolean(
                state.errors.email?.length,
              )}
            />

            <FieldError messages={state.errors.email} />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>

            <Select
              id="gender"
              name="gender"
              defaultValue={teacher.gender}
              error={Boolean(
                state.errors.gender?.length,
              )}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>

            <FieldError
              messages={state.errors.gender}
            />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">
              Date of birth
            </Label>

            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={teacher.dateOfBirth}
              required
              error={Boolean(
                state.errors.dateOfBirth?.length,
              )}
            />

            <FieldError
              messages={state.errors.dateOfBirth}
            />
          </div>

          <div>
            <Label htmlFor="employmentDate">
              Employment date
            </Label>

            <Input
              id="employmentDate"
              name="employmentDate"
              type="date"
              defaultValue={teacher.employmentDate}
              required
              error={Boolean(
                state.errors.employmentDate?.length,
              )}
            />

            <FieldError
              messages={state.errors.employmentDate}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Professional Information
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="qualification">
              Qualification
            </Label>

            <Input
              id="qualification"
              name="qualification"
              defaultValue={teacher.qualification}
              required
              error={Boolean(
                state.errors.qualification?.length,
              )}
            />

            <FieldError
              messages={state.errors.qualification}
            />
          </div>

          <div>
            <Label htmlFor="specialization">
              Specialization
            </Label>

            <Input
              id="specialization"
              name="specialization"
              defaultValue={teacher.specialization}
              error={Boolean(
                state.errors.specialization?.length,
              )}
            />

            <FieldError
              messages={state.errors.specialization}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>

            <Textarea
              id="address"
              name="address"
              rows={4}
              defaultValue={teacher.address}
              error={Boolean(
                state.errors.address?.length,
              )}
            />

            <FieldError
              messages={state.errors.address}
            />
          </div>
        </div>
      </Card>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            Teacher record updated successfully.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="min-w-44"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
