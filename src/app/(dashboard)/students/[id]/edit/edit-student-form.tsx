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
import { initialUpdateStudentState } from "@/lib/validations";

import { updateStudentAction } from "./actions";

type StudentData = {
  id: string;
  admissionNumber: string;
  surname: string;
  firstName: string;
  otherName: string;
  gender: "male" | "female";
  dateOfBirth: string;
  admissionDate: string;
  residentialAddress: string;
  status:
    | "active"
    | "inactive"
    | "suspended"
    | "graduated"
    | "withdrawn"
    | "archived";
};

type EnrollmentData = {
  id: string;
  classId: string;
  sessionName: string;
};

type GuardianData = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  relationship:
    | "father"
    | "mother"
    | "guardian"
    | "brother"
    | "sister"
    | "uncle"
    | "aunt"
    | "other";
};

type SchoolClass = {
  id: string;
  name: string;
  sort_order: number;
};

type EditStudentFormProps = {
  student: StudentData;
  enrollment: EnrollmentData;
  guardian: GuardianData;
  classes: SchoolClass[];
};

export function EditStudentForm({
  student,
  enrollment,
  guardian,
  classes,
}: EditStudentFormProps) {
  const [state, formAction, pending] = useActionState(
    updateStudentAction,
    initialUpdateStudentState,
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
        name="studentId"
        value={student.id}
      />

      <input
        type="hidden"
        name="enrollmentId"
        value={enrollment.id}
      />

      <input
        type="hidden"
        name="guardianId"
        value={guardian.id}
      />

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Student Record
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Admission number cannot be edited.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="admissionNumber">
              Admission number
            </Label>

            <Input
              id="admissionNumber"
              value={student.admissionNumber}
              readOnly
              className="cursor-not-allowed border-amber-200 bg-amber-50 font-semibold text-amber-800"
            />
          </div>

          <div>
            <Label htmlFor="status">Student status</Label>

            <Select
              id="status"
              name="status"
              defaultValue={student.status}
              error={Boolean(state.errors.status?.length)}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="graduated">Graduated</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="archived">Archived</option>
            </Select>

            <FieldError messages={state.errors.status} />
          </div>

          <div>
            <Label htmlFor="classId">Current class</Label>

            <Select
              id="classId"
              name="classId"
              defaultValue={enrollment.classId}
              error={Boolean(state.errors.classId?.length)}
            >
              {classes.map((schoolClass) => (
                <option
                  key={schoolClass.id}
                  value={schoolClass.id}
                >
                  {schoolClass.name}
                </option>
              ))}
            </Select>

            <FieldError messages={state.errors.classId} />

            <p className="mt-1 text-xs text-slate-500">
              Session: {enrollment.sessionName}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Personal Information
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="surname">Surname</Label>

            <Input
              id="surname"
              name="surname"
              defaultValue={student.surname}
              required
              error={Boolean(state.errors.surname?.length)}
            />

            <FieldError messages={state.errors.surname} />
          </div>

          <div>
            <Label htmlFor="firstName">First name</Label>

            <Input
              id="firstName"
              name="firstName"
              defaultValue={student.firstName}
              required
              error={Boolean(state.errors.firstName?.length)}
            />

            <FieldError messages={state.errors.firstName} />
          </div>

          <div>
            <Label htmlFor="otherName">Other name</Label>

            <Input
              id="otherName"
              name="otherName"
              defaultValue={student.otherName}
              error={Boolean(state.errors.otherName?.length)}
            />

            <FieldError messages={state.errors.otherName} />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>

            <Select
              id="gender"
              name="gender"
              defaultValue={student.gender}
              error={Boolean(state.errors.gender?.length)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>

            <FieldError messages={state.errors.gender} />
          </div>

          <div>
            <Label htmlFor="dateOfBirth">
              Date of birth
            </Label>

            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={student.dateOfBirth}
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
            <Label htmlFor="admissionDate">
              Admission date
            </Label>

            <Input
              id="admissionDate"
              name="admissionDate"
              type="date"
              defaultValue={student.admissionDate}
              required
              error={Boolean(
                state.errors.admissionDate?.length,
              )}
            />

            <FieldError
              messages={state.errors.admissionDate}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="residentialAddress">
              Residential address
            </Label>

            <Textarea
              id="residentialAddress"
              name="residentialAddress"
              rows={4}
              defaultValue={student.residentialAddress}
              error={Boolean(
                state.errors.residentialAddress?.length,
              )}
            />

            <FieldError
              messages={state.errors.residentialAddress}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Parent or Guardian
        </h2>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="guardianName">
              Full name
            </Label>

            <Input
              id="guardianName"
              name="guardianName"
              defaultValue={guardian.fullName}
              required
              error={Boolean(
                state.errors.guardianName?.length,
              )}
            />

            <FieldError
              messages={state.errors.guardianName}
            />
          </div>

          <div>
            <Label htmlFor="guardianPhone">
              Phone number
            </Label>

            <Input
              id="guardianPhone"
              name="guardianPhone"
              type="tel"
              defaultValue={guardian.phone}
              required
              error={Boolean(
                state.errors.guardianPhone?.length,
              )}
            />

            <FieldError
              messages={state.errors.guardianPhone}
            />
          </div>

          <div>
            <Label htmlFor="guardianEmail">Email</Label>

            <Input
              id="guardianEmail"
              name="guardianEmail"
              type="email"
              defaultValue={guardian.email}
              error={Boolean(
                state.errors.guardianEmail?.length,
              )}
            />

            <FieldError
              messages={state.errors.guardianEmail}
            />
          </div>

          <div>
            <Label htmlFor="guardianOccupation">
              Occupation
            </Label>

            <Input
              id="guardianOccupation"
              name="guardianOccupation"
              defaultValue={guardian.occupation}
              error={Boolean(
                state.errors.guardianOccupation?.length,
              )}
            />

            <FieldError
              messages={state.errors.guardianOccupation}
            />
          </div>

          <div>
            <Label htmlFor="guardianRelationship">
              Relationship
            </Label>

            <Select
              id="guardianRelationship"
              name="guardianRelationship"
              defaultValue={guardian.relationship}
              error={Boolean(
                state.errors.guardianRelationship?.length,
              )}
            >
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
              <option value="brother">Brother</option>
              <option value="sister">Sister</option>
              <option value="uncle">Uncle</option>
              <option value="aunt">Aunt</option>
              <option value="other">Other</option>
            </Select>

            <FieldError
              messages={
                state.errors.guardianRelationship
              }
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Label htmlFor="guardianAddress">
              Address
            </Label>

            <Textarea
              id="guardianAddress"
              name="guardianAddress"
              rows={4}
              defaultValue={guardian.address}
              required
              error={Boolean(
                state.errors.guardianAddress?.length,
              )}
            />

            <FieldError
              messages={state.errors.guardianAddress}
            />
          </div>
        </div>
      </Card>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            Student record updated successfully.
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
