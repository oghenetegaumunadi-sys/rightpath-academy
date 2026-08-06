import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function StudentNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <GraduationCap className="size-8" />
        </div>

        <h1 className="mt-5 text-2xl font-semibold text-slate-950">
          Student not found
        </h1>

        <p className="mt-3 leading-7 text-slate-600">
          The student record may have been removed, archived or the
          link may be incorrect.
        </p>

        <Link
          href="/students"
          className="mt-6 inline-flex rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
        >
          Return to students
        </Link>
      </div>
    </div>
  );
}
