"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createSubjectSchema,
  initialCreateSubjectState,
  type CreateSubjectState,
} from "@/lib/validations";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createSubjectAction(
  _previousState: CreateSubjectState,
  formData: FormData,
): Promise<CreateSubjectState> {
  const parsed = createSubjectSchema.safeParse({
    name: getString(formData, "name"),
    code: getString(formData, "code"),
    description: getString(formData, "description"),
    isCore: formData.get("isCore") === "on",
  });

  if (!parsed.success) {
    return {
      ...initialCreateSubjectState,
      message: "Please correct the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ...initialCreateSubjectState,
      message: "Your session has expired. Please sign in again.",
    };
  }

  const role = await ensureUserRole(user.id, user.email);

  if (
    !role ||
    !["principal", "vice_principal", "admin"].includes(role)
  ) {
    return {
      ...initialCreateSubjectState,
      message:
        "Your account does not have permission to create subjects.",
    };
  }

  const admin = createAdminClient();

  const { data: subject, error } = await admin
    .from("subjects")
    .insert({
      name: parsed.data.name,
      code: parsed.data.code,
      description: parsed.data.description,
      is_core: parsed.data.isCore,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Subject creation failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    return {
      ...initialCreateSubjectState,
      message:
        error.code === "23505"
          ? "A subject with this name or code already exists."
          : error.message,
    };
  }

  revalidatePath("/subjects");
  revalidatePath("/dashboard/principal");

  return {
    success: true,
    message: "Subject created successfully.",
    subjectId: subject.id,
    errors: {},
  };
}
