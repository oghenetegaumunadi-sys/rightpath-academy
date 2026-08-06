import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { UserControls } from "./user-controls";

type UserPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Manage User",
};

export default async function UserPage({
  params,
}: UserPageProps) {
  const { id } = await params;
  const admin = createAdminClient();

  const [
    { data: profile, error: profileError },
    { data: roles, error: rolesError },
    { data: profileRoles, error: profileRolesError },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        status,
        last_login_at,
        created_at,
        updated_at
      `)
      .eq("id", id)
      .maybeSingle(),

    admin
      .from("roles")
      .select(`
        id,
        name,
        display_name,
        description
      `)
      .order("display_name"),

    admin
      .from("profile_roles")
      .select(`
        role_id,
        assigned_at,
        roles (
          id,
          name,
          display_name
        )
      `)
      .eq("profile_id", id),
  ]);

  if (profileError) {
    console.error("Unable to load user:", {
      message: profileError.message,
      code: profileError.code,
      details: profileError.details,
      hint: profileError.hint,
    });
  }

  if (rolesError) {
    console.error("Unable to load roles:", {
      message: rolesError.message,
      code: rolesError.code,
      details: rolesError.details,
      hint: rolesError.hint,
    });
  }

  if (profileRolesError) {
    console.error("Unable to load assigned roles:", {
      message: profileRolesError.message,
      code: profileRolesError.code,
      details: profileRolesError.details,
      hint: profileRolesError.hint,
    });
  }

  if (!profile) {
    notFound();
  }

  const assignedRoleIds =
    profileRoles?.map((item) => item.role_id) ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <section>
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to user management
        </Link>

        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
              <UserRound className="size-8" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                  {profile.full_name}
                </h1>

                <Badge
                  variant={
                    profile.status === "active"
                      ? "success"
                      : profile.status ===
                          "suspended"
                        ? "danger"
                        : "warning"
                  }
                >
                  {profile.status}
                </Badge>
              </div>

              <p className="mt-2 text-slate-600">
                Manage account access and assigned roles.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DetailCard
          label="Email"
          value={profile.email}
          icon={Mail}
        />

        <DetailCard
          label="Phone"
          value={profile.phone ?? "Not provided"}
          icon={Phone}
        />

        <DetailCard
          label="Last Login"
          value={
            profile.last_login_at
              ? formatDateTime(profile.last_login_at)
              : "Never"
          }
          icon={CalendarClock}
        />

        <DetailCard
          label="Roles"
          value={String(assignedRoleIds.length)}
          icon={ShieldCheck}
        />
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Assigned Roles
        </h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {profileRoles?.length ? (
            profileRoles.map((item) => {
              const relation = item.roles;

              const role = Array.isArray(relation)
                ? relation[0]
                : relation;

              return role ? (
                <Badge
                  key={role.id}
                  variant="info"
                >
                  {role.display_name}
                </Badge>
              ) : null;
            })
          ) : (
            <Badge variant="warning">
              No role assigned
            </Badge>
          )}
        </div>
      </Card>

      <UserControls
        profileId={profile.id}
        currentStatus={profile.status}
        roles={
          roles?.map((role) => ({
            id: role.id,
            name: role.name,
            displayName: role.display_name,
            description: role.description,
          })) ?? []
        }
        assignedRoleIds={assignedRoleIds}
      />
    </div>
  );
}

function DetailCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Mail;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <Icon className="size-5" />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {label}
          </p>

          <p className="mt-2 break-words font-semibold text-slate-900">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
