import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  KeyRound,
  UserRound,
} from "lucide-react";
import {
  notFound,
} from "next/navigation";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { ActivateParentPortalForm } from "./activate-parent-portal-form";

export const metadata: Metadata = {
  title: "Parent Portal Access",
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParentPortalAccessPage({
  params,
}: PageProps) {
  const { id } = await params;

  const admin =
    createAdminClient();

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
      relationship,
      status,
      profile_id,
      parent_portal_id,
      must_change_password,
      student_parents (
        student_id,
        relationship,
        is_primary_contact,
        students (
          id,
          admission_number,
          surname,
          first_name,
          other_name
        )
      )
    `)
    .eq("id", id)
    .maybeSingle();

  if (
    error ||
    !parent
  ) {
    notFound();
  }

  const linkedChildren =
    parent.student_parents
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
          isPrimary:
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

  const portalActive =
    Boolean(
      parent.profile_id &&
      parent.parent_portal_id,
    );

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to students
        </Link>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950">
          Parent Portal Access
        </h1>

        <p className="mt-2 text-slate-600">
          Create and manage login access for this parent or guardian.
        </p>
      </section>

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
            <UserRound className="size-6" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-950">
                {parent.full_name}
              </h2>

              <Badge
                variant={
                  portalActive
                    ? "success"
                    : "warning"
                }
              >
                {portalActive
                  ? "Portal Active"
                  : "No Portal Access"}
              </Badge>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {parent.phone}
              {parent.email
                ? ` · ${parent.email}`
                : ""}
            </p>

            {portalActive ? (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Parent ID
                </p>

                <p className="mt-1 font-mono text-lg font-bold text-green-950">
                  {parent.parent_portal_id}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-slate-950">
          Linked Children
        </h2>

        <div className="mt-5 space-y-3">
          {linkedChildren.map(
            (child) => (
              <div
                key={child.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {child.fullName}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {child.admissionNumber}
                  </p>
                </div>

                {child.isPrimary ? (
                  <Badge variant="success">
                    Primary
                  </Badge>
                ) : null}
              </div>
            ),
          )}
        </div>
      </Card>

      {!portalActive ? (
        <Card className="border-amber-200 bg-amber-50">
          <div className="flex gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <KeyRound className="size-5" />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold text-amber-950">
                Activate Login Access
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-800">
                The system will generate a Parent ID,
                create an authentication account and
                assign the parent role.
              </p>

              <div className="mt-5">
                <ActivateParentPortalForm
                  parentId={parent.id}
                />
              </div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
