"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Button,
  Card,
  Input,
  Label,
} from "@/components/ui";

import {
  initialRegisterTeacherState,
} from "@/lib/validations";

import { registerTeacherAction } from "./actions";

export function TeacherRegistrationForm() {
  const router = useRouter();

  const [state, formAction, pending] =
    useActionState(
      registerTeacherAction,
      initialRegisterTeacherState,
    );

  useEffect(() => {
    if (state.success) {
      toast.success(state.message ?? "Teacher registered.");

      router.push("/teachers");
    }

    if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <Card className="p-8">
      <form
        action={formAction}
        className="grid gap-6 md:grid-cols-2"
      >
        <div>
          <Label>Full Name</Label>

          <Input
            name="fullName"
            required
          />
        </div>

        <div>
          <Label>Phone Number</Label>

          <Input
            name="phone"
            required
          />
        </div>

        <div>
          <Label>Email</Label>

          <Input
            name="email"
            type="email"
          />
        </div>

        <div>
          <Label>Gender</Label>

          <select
            name="gender"
            required
            className="w-full rounded-xl border border-slate-300 p-3"
          >
            <option value="">
              Select gender
            </option>

            <option value="male">
              Male
            </option>

            <option value="female">
              Female
            </option>
          </select>
        </div>

        <div>
          <Label>Date of Birth</Label>

          <Input
            name="dateOfBirth"
            type="date"
            required
          />
        </div>

        <div>
          <Label>Employment Date</Label>

          <Input
            name="employmentDate"
            type="date"
            required
          />
        </div>

        <div>
          <Label>Qualification</Label>

          <Input
            name="qualification"
            required
          />
        </div>

        <div>
          <Label>Specialization</Label>

          <Input
            name="specialization"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Address</Label>

          <Input
            name="address"
          />
        </div>

        <div className="md:col-span-2 flex justify-end">
          <Button
            type="submit"
            disabled={pending}
          >
            {pending
              ? "Registering..."
              : "Register Teacher"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
