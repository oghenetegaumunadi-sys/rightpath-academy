import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  MailPlus,
  ShieldCheck,
} from "lucide-react";

import { Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { InviteUserForm } from "./invite-user-form";

export const metadata: Metadata = {
  title: "Create User Account",
};

export default async function InviteUserPage() {
  const admin = createAdminClient();

  const { data: roles, error } = await admin
    .from("roles")
    .select(`
      id,
      name,
      display_name,
      description
    `)
    .in("name", [
      "director",
      "school_admin",
      "head_teacher",
      "teacher",
      "parent",
    ])
    .order("display_name");

  if (error) {
    console.error("Unable to load invitation roles:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to user management
        </Link>

        <div className="mt-5 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white">
            <MailPlus className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              Create User Account
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Create a school account, assign its role and issue temporary login credentials.
            </p>
          </div>
        </div>
      </section>

      <Card className="border-green-200 bg-green-50">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-700" />

          <div>
            <p className="font-semibold text-green-950">
              Director-controlled account creation
            </p>

            <p className="mt-1 text-sm leading-6 text-green-800">
              The School Director creates the account directly. The user receives temporary credentials and must change the password on first login.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <InviteUserForm
          roles={
            roles?.map((role) => ({
              id: role.id,
              name: role.name,
              displayName: role.display_name,
              description: role.description,
            })) ?? []
          }
        />
      </Card>
    </div>
  );
}
