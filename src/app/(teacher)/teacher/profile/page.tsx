import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { Badge, Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "My Profile",
};

export default async function TeacherProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const {
    data: teacher,
    error,
  } = await admin
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
      passport_url,
      status,
      must_change_password
    `)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    error ||
    !teacher ||
    teacher.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Teacher Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          My Profile
        </h1>

        <p className="mt-2 text-slate-600">
          View your staff information and account details.
        </p>
      </section>

      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-green-100 text-green-700">
            {teacher.passport_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={teacher.passport_url}
                alt={teacher.full_name}
                className="size-full object-cover"
              />
            ) : (
              <UserRound className="size-11" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-950">
                {teacher.full_name}
              </h2>

              <Badge variant="success">
                Active
              </Badge>
            </div>

            <p className="mt-2 font-semibold text-green-700">
              {teacher.employee_id}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              {teacher.specialization ??
                "Teaching staff"}
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

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Personal Information
              </h2>

              <p className="text-sm text-slate-500">
                Your registered staff details
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            <ProfileRow
              icon={Phone}
              label="Phone"
              value={teacher.phone}
            />

            <ProfileRow
              icon={Mail}
              label="Email"
              value={
                teacher.email ||
                "Not provided"
              }
            />

            <ProfileRow
              icon={UserRound}
              label="Gender"
              value={
                teacher.gender
                  ? capitalize(teacher.gender)
                  : "Not provided"
              }
            />

            <ProfileRow
              icon={CalendarDays}
              label="Date of Birth"
              value={
                teacher.date_of_birth
                  ? formatDate(
                      teacher.date_of_birth,
                    )
                  : "Not provided"
              }
            />

            <ProfileRow
              icon={MapPin}
              label="Address"
              value={
                teacher.address ||
                "Not provided"
              }
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <BriefcaseBusiness className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Employment Information
              </h2>

              <p className="text-sm text-slate-500">
                School employment record
              </p>
            </div>
          </div>

          <div className="mt-6 divide-y divide-slate-100">
            <ProfileRow
              icon={BadgeCheck}
              label="Staff ID"
              value={teacher.employee_id}
            />

            <ProfileRow
              icon={CalendarDays}
              label="Employment Date"
              value={
                teacher.employment_date
                  ? formatDate(
                      teacher.employment_date,
                    )
                  : "Not provided"
              }
            />

            <ProfileRow
              icon={ShieldCheck}
              label="Qualification"
              value={
                teacher.qualification ||
                "Not provided"
              }
            />

            <ProfileRow
              icon={BriefcaseBusiness}
              label="Specialization"
              value={
                teacher.specialization ||
                "Not provided"
              }
            />
          </div>
        </Card>
      </section>

      <Card className="border-green-200 bg-green-50">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <KeyRound className="size-5" />
            </div>

            <div>
              <h2 className="font-semibold text-green-950">
                Account Security
              </h2>

              <p className="mt-1 text-sm leading-6 text-green-800">
                Change your portal password whenever necessary.
              </p>
            </div>
          </div>

          <Link
            href="/change-password"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            <KeyRound className="size-4" />
            Change Password
          </Link>
        </div>
      </Card>

      <Card className="border-amber-200 bg-amber-50">
        <p className="font-semibold text-amber-900">
          Need to correct your staff information?
        </p>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          Contact the school administrator. Teachers cannot
          directly change official employment records from the
          portal.
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(
    new Date(`${value}T00:00:00`),
  );
}

function capitalize(value: string) {
  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}
