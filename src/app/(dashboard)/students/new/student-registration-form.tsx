"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Save,
  UserRound,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
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
import { initialRegisterStudentState } from "@/lib/validations";

import { registerStudentAction } from "./actions";

type SchoolClass = {
  id: string;
  name: string;
  school_level_id: string;
  sort_order: number;
  admission_code: string;
};

type AcademicSession = {
  id: string;
  name: string;
  is_current: boolean;
};

type StudentRegistrationFormProps = {
  classes: SchoolClass[];
  sessions: AcademicSession[];
};

export function StudentRegistrationForm({
  classes,
  sessions,
}: StudentRegistrationFormProps) {
  const [state, formAction, pending] = useActionState(
    registerStudentAction,
    initialRegisterStudentState,
  );

  const [selectedClassId, setSelectedClassId] = useState("");

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const currentSession =
    sessions.find((session) => session.is_current) ??
    sessions[0];

  const selectedClass = useMemo(
    () =>
      classes.find(
        (schoolClass) =>
          schoolClass.id === selectedClassId,
      ),
    [classes, selectedClassId],
  );

  const admissionPreview = selectedClass
    ? `RPA/${selectedClass.admission_code}/Auto`
    : "Select a class first";

  return (
    <form action={formAction} className="space-y-8">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <UserRound className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Personal Information
            </h2>
            <p className="text-sm text-slate-500">
              Basic student identity and contact information.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="surname">Surname</Label>
            <Input
              id="surname"
              name="surname"
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
              error={Boolean(state.errors.otherName?.length)}
            />
            <FieldError messages={state.errors.otherName} />
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              id="gender"
              name="gender"
              required
              defaultValue=""
              error={Boolean(state.errors.gender?.length)}
            >
              <option value="" disabled>
                Select gender
              </option>
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
            <Label htmlFor="residentialAddress">
              Residential address
            </Label>
            <Input
              id="residentialAddress"
              name="residentialAddress"
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
          Academic Information
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Assign the student to the correct class and session.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="admissionDate">
              Admission date
            </Label>
            <Input
              id="admissionDate"
              name="admissionDate"
              type="date"
              required
              error={Boolean(
                state.errors.admissionDate?.length,
              )}
            />
            <FieldError
              messages={state.errors.admissionDate}
            />
          </div>

          <div>
            <Label htmlFor="classId">Class</Label>
            <Select
              id="classId"
              name="classId"
              required
              value={selectedClassId}
              onChange={(event) =>
                setSelectedClassId(event.target.value)
              }
              error={Boolean(state.errors.classId?.length)}
            >
              <option value="" disabled>
                Select class
              </option>

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
          </div>

          <div>
            <Label htmlFor="academicSessionId">
              Academic session
            </Label>
            <Select
              id="academicSessionId"
              name="academicSessionId"
              required
              defaultValue={currentSession?.id ?? ""}
              error={Boolean(
                state.errors.academicSessionId?.length,
              )}
            >
              <option value="" disabled>
                Select session
              </option>

              {sessions.map((session) => (
                <option
                  key={session.id}
                  value={session.id}
                >
                  {session.name}
                  {session.is_current ? " — Current" : ""}
                </option>
              ))}
            </Select>
            <FieldError
              messages={state.errors.academicSessionId}
            />
          </div>

          <div>
            <Label htmlFor="admissionNumberPreview">
              Admission number
            </Label>
            <Input
              id="admissionNumberPreview"
              value={admissionPreview}
              readOnly
              className="cursor-not-allowed border-amber-200 bg-amber-50 font-semibold text-amber-800"
            />
            <p className="mt-1 text-xs text-slate-500">
              The final serial number is generated during registration.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Parent or Guardian
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Add the primary contact responsible for the student.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="guardianName">
              Full name
            </Label>
            <Input
              id="guardianName"
              name="guardianName"
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
              required
              defaultValue="guardian"
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

      {state.success && state.studentId ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />
          <p className="font-semibold">
            Student record created successfully.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          loading={pending}
          className="min-w-48"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending ? "Registering..." : "Register Student"}
        </Button>
      </div>
    </form>
  );
}
