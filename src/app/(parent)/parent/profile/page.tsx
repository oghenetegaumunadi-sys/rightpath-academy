import {
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function ParentProfilePage() {
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
    error,
  } = await admin
    .from("parents")
    .select(`
      id,
      full_name,
      phone,
      email,
      address,
      occupation,
      relationship,
      parent_portal_id,
      status
    `)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    error ||
    !parent ||
    parent.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  const {
    data: links,
  } = await admin
    .from("student_parents")
    .select(`
      student_id,
      is_primary_contact,
      students (
        id,
        admission_number,
        surname,
        first_name,
        other_name
      )
    `)
    .eq("parent_id", parent.id);

  const linkedChildren =
    links
      ?.map((link) => {
        const relation =
          link.students;

        const student =
          Array.isArray(relation)
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
          primary:
            link.is_primary_contact,
        };
      })
      .filter(
        (
          child,
        ): child is NonNullable<
          typeof child
        > => Boolean(child),
      ) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Parent Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          My Profile
        </h1>

        <p className="mt-2 text-slate-600">
          View your registered parent and guardian information.
        </p>
      </section>

      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-green-100 text-green-700">
            <UserRound className="size-9" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-950">
                {parent.full_name}
              </h2>

              <Badge variant="success">
                Active
              </Badge>
            </div>

            <p className="mt-2 font-mono font-semibold text-green-700">
              {parent.parent_portal_id ??
                "Parent ID unavailable"}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {formatStatus(
                parent.relationship,
              )}
            </p>
          </div>
        </div>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <UserRound className="size-5" />
            </div>

            <h2 className="text-lg font-semibold text-slate-950">
              Contact Information
            </h2>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            <ProfileRow
              icon={Phone}
              label="Phone"
              value={parent.phone}
            />

            <ProfileRow
              icon={Mail}
              label="Email"
              value={
                parent.email ??
                "Not provided"
              }
            />

            <ProfileRow
              icon={MapPin}
              label="Address"
              value={parent.address}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <BriefcaseBusiness className="size-5" />
            </div>

            <h2 className="text-lg font-semibold text-slate-950">
              Guardian Information
            </h2>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            <ProfileRow
              icon={BriefcaseBusiness}
              label="Occupation"
              value={
                parent.occupation ??
                "Not provided"
              }
            />

            <ProfileRow
              icon={ShieldCheck}
              label="Relationship"
              value={formatStatus(
                parent.relationship,
              )}
            />

            <ProfileRow
              icon={UserRound}
              label="Linked Children"
              value={String(
                linkedChildren.length,
              )}
            />
          </div>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Linked Children
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {linkedChildren.map(
            (child) => (
              <div
                key={child.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {child.fullName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {child.admissionNumber}
                    </p>
                  </div>

                  {child.primary ? (
                    <Badge variant="success">
                      Primary
                    </Badge>
                  ) : null}
                </div>
              </div>
            ),
          )}
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <p className="font-semibold text-amber-950">
          Need to update your information?
        </p>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          Contact the school administrator to update official parent or
          guardian information.
        </p>
      </Card>
    </div>
  );
}

function ProfileRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="size-4" />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words font-medium text-slate-800">
          {value}
        </p>
      </div>
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
