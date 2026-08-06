import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { EditTeacherForm } from "./edit-teacher-form";

type EditTeacherPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Teacher",
};

export default async function EditTeacherPage({
  params,
}: EditTeacherPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: teacher, error } = await supabase
    .from("teachers")
    .select(`
      id,
      employee_id,
      full_name,
      phone,
      email,
      gender,
      date_of_birth,
      employment_date,
      qualification,
      specialization,
      address,
      status
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load teacher:", error);
  }

  if (!teacher) {
    notFound();
  }

  if (
    teacher.gender !== "male" &&
    teacher.gender !== "female"
  ) {
    throw new Error(
      "This teacher record does not have a valid gender.",
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href={`/teachers/${teacher.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to teacher profile
        </Link>

        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Edit Teacher
        </h1>

        <p className="mt-2 text-slate-600">
          Update staff record {teacher.employee_id}.
        </p>
      </div>

      <EditTeacherForm
        teacher={{
          id: teacher.id,
          employeeId: teacher.employee_id,
          fullName: teacher.full_name,
          phone: teacher.phone,
          email: teacher.email ?? "",
          gender: teacher.gender,
          dateOfBirth: teacher.date_of_birth ?? "",
          employmentDate:
            teacher.employment_date ?? "",
          qualification:
            teacher.qualification ?? "",
          specialization:
            teacher.specialization ?? "",
          address: teacher.address ?? "",
          status: teacher.status,
        }}
      />
    </div>
  );
}
