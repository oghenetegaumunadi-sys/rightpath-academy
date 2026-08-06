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
  title: "Invite User",
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
              Invite User
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Send a secure invitation and assign the user’s roles.
            </p>
          </div>
        </div>
      </section>

      <Card className="border-green-200 bg-green-50">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-700" />

          <div>
            <p className="font-semibold text-green-950">
              Invite-only access
            </p>

            <p className="mt-1 text-sm leading-6 text-green-800">
              The user receives a secure invitation email and completes account setup from the link.
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
