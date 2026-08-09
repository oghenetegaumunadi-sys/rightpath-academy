import Link from "next/link";
import {
  ChevronRight,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function ParentChildrenPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const {
    data: parent,
    error: parentError,
  } = await admin
    .from("parents")
    .select("id, full_name, status")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    parentError ||
    !parent ||
    parent.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  const {
    data: currentSession,
  } = await admin
    .from("academic_sessions")
    .select("id, name")
    .eq("is_current", true)
    .maybeSingle();

  const {
    data: links,
    error: linksError,
  } = await admin
    .from("student_parents")
    .select(`
      student_id,
      relationship,
      is_primary_contact,
      can_pick_up,
      students (
        id,
        admission_number,
        surname,
        first_name,
        other_name,
        gender,
        status,
        passport_url
      )
    `)
    .eq("parent_id", parent.id);

  if (linksError) {
    console.error(
      "Unable to load linked children:",
      linksError,
    );
  }

  const children =
    links
      ?.map((link) => {
        const relation = link.students;

        const student = Array.isArray(relation)
          ? relation[0]
          : relation;

        if (!student) {
          return null;
        }

        return {
          id: student.id,
          admissionNumber:
            student.admission_number,
          fullName: [
            student.surname,
            student.first_name,
            student.other_name,
          ]
            .filter(Boolean)
            .join(" "),
          gender: student.gender,
          status: student.status,
          passportUrl:
            student.passport_url,
          relationship:
            link.relationship,
          primary:
            link.is_primary_contact,
          canPickUp:
            link.can_pick_up,
        };
      })
      .filter(
        (
          child,
        ): child is NonNullable<
          typeof child
        > => Boolean(child),
      ) ?? [];

  const childIds = children.map(
    (child) => child.id,
  );

  const classMap = new Map<
    string,
    string
  >();

  if (
    currentSession &&
    childIds.length
  ) {
    const {
      data: enrollments,
    } = await admin
      .from("student_enrollments")
      .select(`
        student_id,
        classes (
          id,
          name
        )
      `)
      .in("student_id", childIds)
      .eq(
        "academic_session_id",
        currentSession.id,
      )
      .eq("status", "active");

    for (const enrollment of
      enrollments ?? []) {
      const relation =
        enrollment.classes;

      const schoolClass =
        Array.isArray(relation)
          ? relation[0]
          : relation;

      if (schoolClass) {
        classMap.set(
          enrollment.student_id,
          schoolClass.name,
        );
      }
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Parent Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          My Children
        </h1>

        <p className="mt-2 text-slate-600">
          View the students linked to your
          parent account
          {currentSession?.name
            ? ` · ${currentSession.name}`
            : ""}.
        </p>
      </section>

      {children.length ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {children.map((child) => (
            <Card
              key={child.id}
              className="overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-green-100 text-green-700">
                  {child.passportUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={child.passportUrl}
                      alt={child.fullName}
                      className="size-full object-cover"
                    />
                  ) : (
                    <GraduationCap className="size-8" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-950">
                      {child.fullName}
                    </h2>

                    {child.primary ? (
                      <Badge variant="success">
                        Primary
                      </Badge>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {child.admissionNumber}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                <Detail
                  label="Class"
                  value={
                    classMap.get(child.id) ??
                    "Not enrolled"
                  }
                />

                <Detail
                  label="Relationship"
                  value={formatStatus(
                    child.relationship,
                  )}
                />

                <Detail
                  label="Student Status"
                  value={formatStatus(
                    child.status,
                  )}
                />

                <Detail
                  label="Pickup Permission"
                  value={
                    child.canPickUp
                      ? "Authorized"
                      : "Not authorized"
                  }
                />
              </div>

              <Link
                href={`/parent/children/${child.id}`}
                className="mt-6 flex items-center justify-between rounded-xl border border-green-200 px-4 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
              >
                View Child
                <ChevronRight className="size-4" />
              </Link>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="border-dashed py-16 text-center">
          <UsersRound className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No linked children
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Contact the school administrator to
            link your child to this account.
          </p>
        </Card>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="text-right font-semibold text-slate-800">
        {value}
      </span>
    </div>
  );
}

function formatStatus(
  value: string,
) {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}
