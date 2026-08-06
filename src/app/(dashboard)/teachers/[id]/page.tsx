import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  UserRound,
  Users,
} from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

type TeacherProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function generateMetadata({
  params,
}: TeacherProfilePageProps): Promise<Metadata> {
  const { id } = await params;

  if (id === "assign") {
    redirect("/teacher-assignments");
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    notFound();
  }

  const supabase = createAdminClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();

  return {
    title: teacher?.full_name ?? "Teacher Profile",
  };
}

export default async function TeacherProfilePage({
  params,
}: TeacherProfilePageProps) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [
    { data: teacher, error: teacherError },
    { data: assignmentRows, error: assignmentsError },
  ] = await Promise.all([
    supabase
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
        passport_url,
        address,
        status,
        created_at
      `)
      .eq("id", id)
      .maybeSingle(),

    supabase
      .from("teacher_assignments")
      .select(`
        id,
        teacher_id,
        class_subject_id,
        is_class_teacher,
        class_subjects (
          id,
          academic_session_id,
          is_compulsory,
          subjects (
            id,
            name,
            code
          ),
          classes (
            id,
            name
          ),
          academic_sessions (
            id,
            name,
            is_current
          )
        )
      `)
      .eq("teacher_id", id),
  ]);

  if (teacherError) {
    console.error("Unable to load teacher record:", {
      message: teacherError.message,
      code: teacherError.code,
      details: teacherError.details,
      hint: teacherError.hint,
    });
  }

  if (assignmentsError) {
    console.error("Unable to load teacher assignments:", {
      message: assignmentsError.message,
      code: assignmentsError.code,
      details: assignmentsError.details,
      hint: assignmentsError.hint,
    });
  }

  if (!teacher) {
    notFound();
  }

  const teacherAssignments = assignmentRows ?? [];

  const activeAssignments =
    teacherAssignments.filter((assignment) => {
      const classSubject = Array.isArray(
        assignment.class_subjects,
      )
        ? assignment.class_subjects[0]
        : assignment.class_subjects;

      const sessionRelation =
        classSubject?.academic_sessions;

      const session = Array.isArray(sessionRelation)
        ? sessionRelation[0]
        : sessionRelation;

      return session?.is_current ?? true;
    }) ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/teachers"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
          >
            <ArrowLeft className="size-4" />
            Back to teachers
          </Link>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <UserRound className="size-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold text-slate-950">
                  {teacher.full_name}
                </h1>

                <Badge
                  variant={
                    teacher.status === "active"
                      ? "success"
                      : "neutral"
                  }
                >
                  {teacher.status}
                </Badge>
              </div>

              <p className="mt-2 font-medium text-slate-600">
                {teacher.employee_id}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {teacher.specialization ??
                  teacher.qualification}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/results/score-entry?teacher=${teacher.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <BookOpen className="size-4" />
            Enter Scores
          </Link>

          <Link
            href={`/teachers/${teacher.id}/edit`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
        >
          <Pencil className="size-4" />
          Edit Teacher
          </Link>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <h2 className="text-lg font-semibold text-slate-950">
            Personal Information
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              label="Full name"
              value={teacher.full_name}
            />

            <InfoItem
              label="Gender"
              value={teacher.gender ?? "Not provided"}
            />

            <InfoItem
              label="Date of birth"
              value={
                teacher.date_of_birth
                  ? formatDate(teacher.date_of_birth)
                  : "Not provided"
              }
            />

            <InfoItem
              label="Employment date"
              value={
                teacher.employment_date
                  ? formatDate(teacher.employment_date)
                  : "Not provided"
              }
            />

            <InfoItem
              label="Qualification"
              value={teacher.qualification ?? "Not provided"}
            />

            <InfoItem
              label="Specialization"
              value={
                teacher.specialization ?? "Not provided"
              }
            />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <ContactItem
                icon={Phone}
                label="Phone"
                value={teacher.phone}
              />

              <ContactItem
                icon={Mail}
                label="Email"
                value={teacher.email ?? "Not provided"}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 text-green-700" />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Address
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {teacher.address ??
                    "No address has been provided."}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-slate-950">
            Staff Summary
          </h2>

          <div className="mt-6 space-y-5">
            <DetailRow
              label="Staff ID"
              value={teacher.employee_id}
            />

            <DetailRow
              label="Status"
              value={teacher.status}
            />

            <DetailRow
              label="Subject assignments"
              value={String(activeAssignments.length)}
            />

            <DetailRow
              label="Class teacher roles"
              value="0"
            />

            <DetailRow
              label="Registered"
              value={formatDateTime(teacher.created_at)}
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <BookOpen className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Subject Assignments
              </h2>

              <p className="text-sm text-slate-500">
                Current session teaching responsibilities
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {activeAssignments.length ? (
              activeAssignments.map((assignment) => {
                const classSubject = Array.isArray(
                  assignment.class_subjects,
                )
                  ? assignment.class_subjects[0]
                  : assignment.class_subjects;

                const subjectRelation =
                  classSubject?.subjects;

                const subject = Array.isArray(
                  subjectRelation,
                )
                  ? subjectRelation[0]
                  : subjectRelation;

                const classRelation =
                  classSubject?.classes;

                const schoolClass = Array.isArray(
                  classRelation,
                )
                  ? classRelation[0]
                  : classRelation;

                const sessionRelation =
                  classSubject?.academic_sessions;

                const session = Array.isArray(
                  sessionRelation,
                )
                  ? sessionRelation[0]
                  : sessionRelation;

                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {subject?.name ??
                          "Unknown subject"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {schoolClass?.name ??
                          "Unknown class"}
                        {session?.name
                          ? ` · ${session.name}`
                          : ""}
                      </p>
                    </div>

                    <Badge variant="info">
                      {subject?.code ?? "SUB"}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <EmptyAssignment
                icon={BookOpen}
                title="No subject assignments"
                description="Assign subjects and classes to this teacher."
              />
            )}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <GraduationCap className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Class Teacher Assignment
              </h2>

              <p className="text-sm text-slate-500">
                Classes currently managed by this teacher
              </p>
            </div>
          </div>

          <div className="mt-6">
            <EmptyAssignment
              icon={Users}
              title="No class teacher assignment"
              description="Class-teacher assignment will be added during the Classes module."
            />
          </div>
        </Card>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryBox
          icon={CalendarDays}
          label="Attendance"
          value="0%"
        />

        <SummaryBox
          icon={BookOpen}
          label="Subjects"
          value={String(activeAssignments.length)}
        />

        <SummaryBox
          icon={GraduationCap}
          label="Classes"
          value={String(
            new Set(
              activeAssignments.map((assignment) => {
                const classSubject = Array.isArray(
                  assignment.class_subjects,
                )
                  ? assignment.class_subjects[0]
                  : assignment.class_subjects;

                const classRelation =
                  classSubject?.classes;

                const schoolClass = Array.isArray(
                  classRelation,
                )
                  ? classRelation[0]
                  : classRelation;

                return schoolClass?.id;
              }),
            ).size,
          )}
        />

        <SummaryBox
          icon={BriefcaseBusiness}
          label="Results Entered"
          value="0"
        />
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
      <p className="text-sm text-slate-500">
        {label}
      </p>

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

function EmptyAssignment({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
      <Icon className="mx-auto size-8 text-slate-400" />

      <p className="mt-4 font-semibold text-slate-900">
        {title}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SummaryBox({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-semibold text-slate-950">
            {value}
          </p>
        </div>

        <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
