import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { EditStudentForm } from "./edit-student-form";

type EditStudentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Edit Student",
};

export default async function EditStudentPage({
  params,
}: EditStudentPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: student, error: studentError },
    { data: classes, error: classesError },
  ] = await Promise.all([
    supabase
      .from("students")
      .select(`
        id,
        admission_number,
        surname,
        first_name,
        other_name,
        gender,
        date_of_birth,
        admission_date,
        residential_address,
        status,
        student_enrollments (
          id,
          class_id,
          status,
          academic_sessions (
            id,
            name,
            is_current
          )
        ),
        student_parents (
          relationship,
          is_primary_contact,
          parents (
            id,
            full_name,
            phone,
            email,
            address,
            occupation,
            relationship
          )
        )
      `)
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("classes")
      .select("id, name, sort_order")
      .eq("status", "active")
      .order("sort_order"),
  ]);

  if (studentError) {
    console.error("Unable to load student:", studentError);
  }

  if (classesError) {
    console.error("Unable to load classes:", classesError);
  }

  if (!student) {
    notFound();
  }

  const currentEnrollment =
    student.student_enrollments?.find(
      (enrollment) => enrollment.status === "active",
    ) ?? student.student_enrollments?.[0];

  const guardianLink =
    student.student_parents?.find(
      (link) => link.is_primary_contact,
    ) ?? student.student_parents?.[0];

  const guardianRelation = guardianLink?.parents;

  const guardian = Array.isArray(guardianRelation)
    ? guardianRelation[0]
    : guardianRelation;

  if (!currentEnrollment || !guardian) {
    throw new Error(
      "This student record is missing an enrollment or guardian.",
    );
  }

  const sessionRelation =
    currentEnrollment.academic_sessions;

  const session = Array.isArray(sessionRelation)
    ? sessionRelation[0]
    : sessionRelation;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href={`/students/${student.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to student profile
        </Link>

        <h1 className="mt-3 text-3xl font-semibold text-slate-950">
          Edit Student
        </h1>

        <p className="mt-2 text-slate-600">
          Update {student.admission_number} and the linked
          guardian information.
        </p>
      </div>

      <EditStudentForm
        student={{
          id: student.id,
          admissionNumber: student.admission_number,
          surname: student.surname,
          firstName: student.first_name,
          otherName: student.other_name ?? "",
          gender: student.gender,
          dateOfBirth: student.date_of_birth,
          admissionDate: student.admission_date,
          residentialAddress:
            student.residential_address ?? "",
          status: student.status,
        }}
        enrollment={{
          id: currentEnrollment.id,
          classId: currentEnrollment.class_id,
          sessionName: session?.name ?? "Not available",
        }}
        guardian={{
          id: guardian.id,
          fullName: guardian.full_name,
          phone: guardian.phone,
          email: guardian.email ?? "",
          address: guardian.address,
          occupation: guardian.occupation ?? "",
          relationship:
            guardianLink?.relationship ??
            guardian.relationship,
        }}
        classes={classes ?? []}
      />
    </div>
  );
}
