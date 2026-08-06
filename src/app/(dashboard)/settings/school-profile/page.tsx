import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  School,
} from "lucide-react";

import { SchoolLogo } from "@/components/branding/school-logo";
import { Card } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { SchoolProfileForm } from "./school-profile-form";

export const metadata: Metadata = {
  title: "School Profile",
};

export default async function SchoolProfilePage() {
  const admin = createAdminClient();

  const {
    data: profile,
    error,
  } = await admin
    .from("school_profile")
    .select(`
      id,
      school_name,
      short_name,
      motto,
      email,
      phone,
      website,
      address,
      admission_prefix,
      staff_prefix,
      country_code,
      currency_code,
      timezone,
      logo_url
    `)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Unable to load school profile:", {
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
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          <ArrowLeft className="size-4" />
          Back to settings
        </Link>

        <div className="mt-5 flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white">
            <School className="size-6" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950">
              School Profile
            </h1>

            <p className="mt-2 text-slate-600">
              Manage the identity and system defaults for
              RightPath Academy.
            </p>
          </div>
        </div>
      </section>

      <Card>
        <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-green-200 bg-green-50 p-5 sm:flex-row sm:items-center">
          <SchoolLogo
            size="lg"
            href={null}
            showName={false}
            priority
          />

          <div>
            <p className="text-lg font-bold text-green-950">
              {profile?.school_name ??
                "RightPath Academy"}
            </p>

            <p className="mt-1 text-sm text-green-700">
              Current school identity
            </p>
          </div>
        </div>

        <SchoolProfileForm
          profile={
            profile
              ? {
                  id: profile.id,
                  schoolName: profile.school_name,
                  shortName: profile.short_name,
                  motto: profile.motto ?? "",
                  email: profile.email ?? "",
                  phone: profile.phone ?? "",
                  website: profile.website ?? "",
                  address: profile.address ?? "",
                  admissionPrefix:
                    profile.admission_prefix,
                  staffPrefix: profile.staff_prefix,
                  countryCode: profile.country_code,
                  currencyCode:
                    profile.currency_code,
                  timezone: profile.timezone,
                }
              : null
          }
        />
      </Card>
    </div>
  );
}
