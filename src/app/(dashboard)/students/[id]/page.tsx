import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

import { StudentPhotoUploader } from "./photo/student-photo-uploader";
import { StudentStatusButton } from "./student-status-button";

type StudentProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: StudentProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("surname, first_name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: student
      ? `${student.surname} ${student.first_name}`
      : "Student Profile",
  };
}

export default async function StudentProfilePage({
  params,
}: StudentProfilePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student, error } = await supabase
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
      passport_url,
      residential_address,
      status,
      created_at,
      student_enrollments (
        id,
        status,
        enrolled_on,
        academic_sessions (
          id,
          name,
          is_current
        ),
        classes (
          id,
          name,
          admission_code,
          school_levels (
            id,
            name
          )
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
          profile_id,
          parent_portal_id
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Unable to load student profile:", error);
  }

  if (!student) {
    notFound();
  }

  const fullName = [
    student.surname,
    student.first_name,
    student.other_name,
  ]
    .filter(Boolean)
    .join(" ");

  const currentEnrollment =
    student.student_enrollments?.find(
      (enrollment) => enrollment.status === "active",
    ) ?? student.student_enrollments?.[0];

  const classRelation = currentEnrollment?.classes;
  const currentClass = Array.isArray(classRelation)
    ? classRelation[0]
    : classRelation;

  const schoolLevelRelation = currentClass?.school_levels;
  const schoolLevel = Array.isArray(schoolLevelRelation)
    ? schoolLevelRelation[0]
    : schoolLevelRelation;

  const sessionRelation =
    currentEnrollment?.academic_sessions;
  const currentSession = Array.isArray(sessionRelation)
    ? sessionRelation[0]
    : sessionRelation;

  const primaryParentLink =
    student.student_parents?.find(
      (link) => link.is_primary_contact,
    ) ?? student.student_parents?.[0];

  const parentRelation = primaryParentLink?.parents;
  const guardian = Array.isArray(parentRelation)
    ? parentRelation[0]
    : parentRelation;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/students"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
          >
            <ArrowLeft className="size-4" />
            Back to students
          </Link>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <GraduationCap className="size-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-slate-950">
                  {fullName}
                </h1>

                <Badge
                  variant={
                    student.status === "active"
                      ? "success"
                      : "neutral"
                  }
                >
                  {student.status}
                </Badge>
              </div>

              <p className="mt-2 font-medium text-slate-600">
                {student.admission_number}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {currentClass?.name ?? "No class assigned"}
                {currentSession?.name
                  ? ` · ${currentSession.name}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/students/${student.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
          >
            <Pencil className="size-4" />
            Edit Student
          </Link>

          <StudentStatusButton
            studentId={student.id}
            currentStatus={student.status}
          />
        </div>
      </div>

      <StudentPhotoUploader
        studentId={student.id}
        studentName={fullName}
        currentPhotoUrl={student.passport_url}
      />

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-950">
            Personal Information
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Surname"
              value={student.surname}
            />
            <InfoItem
              label="First name"
              value={student.first_name}
            />
            <InfoItem
              label="Other name"
              value={student.other_name ?? "Not provided"}
            />
            <InfoItem
              label="Gender"
              value={student.gender}
            />
            <InfoItem
              label="Date of birth"
              value={formatDate(student.date_of_birth)}
            />
            <InfoItem
              label="Admission date"
              value={formatDate(student.admission_date)}
            />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 text-green-700" />
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Residential address
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {student.residential_address ??
                    "No residential address provided."}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Academic Information
          </h2>

          <div className="mt-6 space-y-5">
            <DetailRow
              label="School level"
              value={schoolLevel?.name ?? "Not assigned"}
            />
            <DetailRow
              label="Current class"
              value={currentClass?.name ?? "Not assigned"}
            />
            <DetailRow
              label="Academic session"
              value={currentSession?.name ?? "Not assigned"}
            />
            <DetailRow
              label="Enrollment status"
              value={currentEnrollment?.status ?? "Not enrolled"}
            />
            <DetailRow
              label="Enrollment date"
              value={
                currentEnrollment?.enrolled_on
                  ? formatDate(currentEnrollment.enrolled_on)
                  : "Not available"
              }
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <UserRound className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Parent or Guardian
              </h2>
              <p className="text-sm text-slate-500">
                Primary contact information
              </p>
            </div>
          </div>

          {guardian ? (
            <div className="mt-6 space-y-5">
              <DetailRow
                label="Full name"
                value={guardian.full_name}
              />
              <DetailRow
                label="Relationship"
                value={
                  primaryParentLink?.relationship ??
                  "Not specified"
                }
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <ContactItem
                  icon={Phone}
                  label="Phone"
                  value={guardian.phone}
                />

                <ContactItem
                  icon={Mail}
                  label="Email"
                  value={guardian.email ?? "Not provided"}
                />
              </div>

              <DetailRow
                label="Occupation"
                value={guardian.occupation ?? "Not provided"}
              />

              <DetailRow
                label="Address"
                value={guardian.address}
              />

              <div className="border-t border-slate-100 pt-5">
                {guardian.profile_id &&
                guardian.parent_portal_id ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div>
                        <p className="text-sm font-semibold text-green-950">
                          Parent Portal Active
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                          Parent ID
                        </p>

                        <p className="mt-1 font-mono font-bold text-green-950">
                          {guardian.parent_portal_id}
                        </p>
                      </div>

                      <Link
                        href={`/parents/${guardian.id}/portal`}
                        className="inline-flex items-center justify-center rounded-xl border border-green-300 bg-white px-4 py-2.5 text-sm font-semibold text-green-800 transition hover:bg-green-100"
                      >
                        Manage Portal
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-950">
                      Parent Portal Not Activated
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-800">
                      Create login credentials for this parent to access
                      their children&apos;s attendance, results and school
                      announcements.
                    </p>

                    <Link
                      href={`/parents/${guardian.id}/portal`}
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-800"
                    >
                      Activate Parent Portal
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              No guardian information is linked to this student.
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <CalendarDays className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Student Summary
              </h2>
              <p className="text-sm text-slate-500">
                Academic and attendance overview
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <SummaryBox
              label="Attendance"
              value="0%"
            />
            <SummaryBox
              label="Results"
              value="0"
            />
            <SummaryBox
              label="Payments"
              value="₦0"
            />
            <SummaryBox
              label="Documents"
              value="0"
            />
          </div>

          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            These summary values will update automatically as the
            Attendance, Results, Finance and Documents modules are
            completed.
          </p>
        </Card>
      </section>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-2 capitalize font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-right text-sm font-semibold capitalize text-slate-900">
        {value}
      </p>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <Icon className="size-5 text-green-700" />
      <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
