import type { Metadata } from "next";
import Link from "next/link";
import {
  Eye,
  MailPlus,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UserX,
  Users,
} from "lucide-react";

import {
  Badge,
  Card,
  Input,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "User Management",
};

type UsersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    role?: string;
  }>;
};

export default async function UsersPage({
  searchParams,
}: UsersPageProps) {
  const {
    search = "",
    status = "",
    role = "",
  } = await searchParams;

  const admin = createAdminClient();

  const [
    { data: profiles, error: profilesError },
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
        created_at
      `)
      .order("full_name"),

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
        profile_id,
        role_id,
        roles (
          id,
          name,
          display_name
        )
      `),
  ]);

  if (profilesError) {
    console.error("Unable to load users:", {
      message: profilesError.message,
      code: profilesError.code,
      details: profilesError.details,
      hint: profilesError.hint,
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
    console.error("Unable to load profile roles:", {
      message: profileRolesError.message,
      code: profileRolesError.code,
      details: profileRolesError.details,
      hint: profileRolesError.hint,
    });
  }

  const users =
    profiles
      ?.map((profile) => {
        const assignedRoles =
          profileRoles
            ?.filter(
              (item) =>
                item.profile_id === profile.id,
            )
            .map((item) => {
              const relation = item.roles;

              return Array.isArray(relation)
                ? relation[0]
                : relation;
            })
            .filter(
              (
                item,
              ): item is NonNullable<typeof item> =>
                Boolean(item),
            ) ?? [];

        return {
          ...profile,
          roles: assignedRoles,
        };
      })
      .filter((user) => {
        const searchValue =
          search.trim().toLowerCase();

        if (
          searchValue &&
          !user.full_name
            .toLowerCase()
            .includes(searchValue) &&
          !user.email
            .toLowerCase()
            .includes(searchValue)
        ) {
          return false;
        }

        if (
          status &&
          user.status !== status
        ) {
          return false;
        }

        if (
          role &&
          !user.roles.some(
            (assignedRole) =>
              assignedRole.id === role,
          )
        ) {
          return false;
        }

        return true;
      }) ?? [];

  const activeCount =
    profiles?.filter(
      (profile) => profile.status === "active",
    ).length ?? 0;

  const suspendedCount =
    profiles?.filter(
      (profile) =>
        profile.status === "suspended",
    ).length ?? 0;

  const usersWithRoles =
    new Set(
      profileRoles?.map(
        (item) => item.profile_id,
      ) ?? [],
    ).size;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white">
            <Users className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              User Management
            </h1>

            <p className="mt-2 text-slate-600">
              Review platform users, account statuses and
              assigned access roles.
            </p>
          </div>
        </div>

        <Link
          href="/users/invite"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
        >
          <MailPlus className="size-5" />
          Invite User
        </Link>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={profiles?.length ?? 0}
          icon={Users}
          tone="neutral"
        />

        <StatCard
          label="Active"
          value={activeCount}
          icon={UserCheck}
          tone="green"
        />

        <StatCard
          label="Suspended"
          value={suspendedCount}
          icon={UserX}
          tone="danger"
        />

        <StatCard
          label="With Roles"
          value={usersWithRoles}
          icon={ShieldCheck}
          tone="amber"
        />
      </section>

      <Card>
        <form className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

            <Input
              name="search"
              type="search"
              defaultValue={search}
              placeholder="Search name or email..."
              className="pl-11"
            />
          </div>

          <select
            name="status"
            defaultValue={status}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
          >
            <option value="">
              All statuses
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
            <option value="suspended">
              Suspended
            </option>
          </select>

          <select
            name="role"
            defaultValue={role}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100"
          >
            <option value="">
              All roles
            </option>

            {roles?.map((item) => (
              <option
                key={item.id}
                value={item.id}
              >
                {item.display_name}
              </option>
            ))}
          </select>

          <div className="flex flex-col gap-3 md:col-span-3 md:flex-row md:justify-end">
            <button
              type="submit"
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              Apply Filters
            </button>

            <Link
              href="/users"
              className="rounded-xl border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        {users.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Roles
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                    Last Login
                  </th>

                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition hover:bg-green-50/30"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-green-100 text-green-700">
                          <UserRound className="size-5" />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-900">
                            {user.full_name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {user.roles.length ? (
                          user.roles.map(
                            (assignedRole) => (
                              <Badge
                                key={assignedRole.id}
                                variant="info"
                              >
                                {
                                  assignedRole.display_name
                                }
                              </Badge>
                            ),
                          )
                        ) : (
                          <Badge variant="warning">
                            No role
                          </Badge>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          user.status === "active"
                            ? "success"
                            : user.status ===
                                "suspended"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {user.status}
                      </Badge>
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {user.last_login_at
                        ? formatDateTime(
                            user.last_login_at,
                          )
                        : "Never"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/users/${user.id}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-green-200 px-3 py-2 text-sm font-semibold text-green-800 transition hover:bg-green-50"
                      >
                        <Eye className="size-4" />
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Users className="mx-auto size-12 text-slate-400" />

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              No users found
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              No user accounts match the selected filters.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone:
    | "green"
    | "amber"
    | "danger"
    | "neutral";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
    neutral: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex size-11 items-center justify-center rounded-xl ${styles[tone]}`}
        >
          <Icon className="size-5" />
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
