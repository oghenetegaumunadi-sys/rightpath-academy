import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SubjectForm } from "./subject-form";

export const metadata: Metadata = {
  title: "Add Subject",
};

export default function NewSubjectPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/subjects"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to subjects
        </Link>

        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Add Subject
        </h1>

        <p className="mt-2 text-slate-600">
          Create a subject for class and teacher assignments.
        </p>
      </div>

      <SubjectForm />
    </div>
  );
}
