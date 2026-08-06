"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SchoolProfileState = {
  success: boolean;
  message: string | null;
};

export async function saveSchoolProfileAction(
  _previousState: SchoolProfileState,
  formData: FormData,
): Promise<SchoolProfileState> {
  try {
    const profileId = String(
      formData.get("profileId") ?? "",
    ).trim();

    const schoolName = String(
      formData.get("schoolName") ?? "",
    ).trim();

    const shortName = String(
      formData.get("shortName") ?? "",
    ).trim();

    const motto =
      String(formData.get("motto") ?? "").trim() ||
      null;

    const email =
      String(formData.get("email") ?? "").trim() ||
      null;

    const phone =
      String(formData.get("phone") ?? "").trim() ||
      null;

    const website =
      String(formData.get("website") ?? "").trim() ||
      null;

    const address =
      String(formData.get("address") ?? "").trim() ||
      null;

    const admissionPrefix = String(
      formData.get("admissionPrefix") ?? "",
    )
      .trim()
      .toUpperCase();

    const staffPrefix = String(
      formData.get("staffPrefix") ?? "",
    )
      .trim()
      .toUpperCase();

    const countryCode = String(
      formData.get("countryCode") ?? "",
    )
      .trim()
      .toUpperCase();

    const currencyCode = String(
      formData.get("currencyCode") ?? "",
    )
      .trim()
      .toUpperCase();

    const timezone = String(
      formData.get("timezone") ?? "",
    ).trim();

    if (schoolName.length < 3) {
      return {
        success: false,
        message:
          "School name must contain at least 3 characters.",
      };
    }

    if (!shortName) {
      return {
        success: false,
        message: "School short name is required.",
      };
    }

    if (!admissionPrefix || !staffPrefix) {
      return {
        success: false,
        message:
          "Admission and staff prefixes are required.",
      };
    }

    if (
      countryCode.length !== 2 ||
      currencyCode.length !== 3
    ) {
      return {
        success: false,
        message:
          "Use a 2-letter country code and a 3-letter currency code.",
      };
    }

    if (!timezone) {
      return {
        success: false,
        message: "Time zone is required.",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.email) {
      return {
        success: false,
        message:
          "Your session has expired. Please sign in again.",
      };
    }

    const role = await ensureUserRole(
      user.id,
      user.email,
    );

    if (
      !role ||
      ![
        "principal",
        "vice_principal",
        "admin",
      ].includes(role)
    ) {
      return {
        success: false,
        message:
          "Your account cannot update school settings.",
      };
    }

    const admin = createAdminClient();

    const payload = {
      school_name: schoolName,
      short_name: shortName,
      motto,
      email,
      phone,
      website,
      address,
      admission_prefix: admissionPrefix,
      staff_prefix: staffPrefix,
      country_code: countryCode,
      currency_code: currencyCode,
      timezone,
      logo_url: "/branding/rightpath-logo.png",
      updated_at: new Date().toISOString(),
    };

    const result = profileId
      ? await admin
          .from("school_profile")
          .update(payload)
          .eq("id", profileId)
          .select("id")
          .maybeSingle()
      : await admin
          .from("school_profile")
          .insert(payload)
          .select("id")
          .single();

    if (result.error || !result.data) {
      return {
        success: false,
        message:
          result.error?.message ??
          "The school profile could not be saved.",
      };
    }

    revalidatePath("/");
    revalidatePath("/login");
    revalidatePath("/settings");
    revalidatePath("/settings/school-profile");
    revalidatePath("/dashboard/principal");
    revalidatePath("/results/report-cards");

    return {
      success: true,
      message:
        "School profile updated successfully.",
    };
  } catch (error) {
    console.error(
      "Unexpected school-profile error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected settings error occurred.",
    };
  }
}
