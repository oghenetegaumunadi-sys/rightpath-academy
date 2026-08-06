import type { Metadata } from "next";

import { TeacherRegistrationForm } from "./teacher-registration-form";

export const metadata: Metadata = {
  title: "Register Teacher",
};

export default function RegisterTeacherPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Register Teacher
        </h1>

        <p className="mt-2 text-slate-600">
          Add a new teacher to RightPath Academy.
        </p>
      </div>

      <TeacherRegistrationForm />
    </div>
  );
}
