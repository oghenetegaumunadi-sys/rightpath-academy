"use server";

import { redirect } from "next/navigation";

import { getDashboardRoute } from "@/lib/auth/roles";
import { getUserRole } from "@/lib/auth/get-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ChangePasswordState = {
  error: string | null;
};

function getSurname(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (
    parts[
      parts.length - 1
    ]?.toLowerCase() ?? ""
  );
}

export async function changePasswordAction(
  _previousState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const password = String(
    formData.get("password") ?? "",
  );

  const confirmPassword = String(
    formData.get("confirmPassword") ?? "",
  );

  if (password.length < 8) {
    return {
      error:
        "Your new password must contain at least 8 characters.",
    };
  }

  if (password !== confirmPassword) {
    return {
      error:
        "The passwords do not match.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error:
        "Your session has expired. Please sign in again.",
    };
  }

  const role = await getUserRole(
    user.id,
  );

  if (
    role !== "teacher" &&
    role !== "parent"
  ) {
    return {
      error:
        "This account cannot use the first-login password change workflow.",
    };
  }

  const admin = createAdminClient();

  let fullName = "";
  let recordId = "";

  if (role === "teacher") {
    const {
      data: teacher,
      error: teacherError,
    } = await admin
      .from("teachers")
      .select(`
        id,
        full_name,
        must_change_password
      `)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (
      teacherError ||
      !teacher
    ) {
      return {
        error:
          teacherError?.message ??
          "Your teacher account could not be found.",
      };
    }

    fullName =
      teacher.full_name;

    recordId =
      teacher.id;
  }

  if (role === "parent") {
    const {
      data: parent,
      error: parentError,
    } = await admin
      .from("parents")
      .select(`
        id,
        full_name,
        must_change_password
      `)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (
      parentError ||
      !parent
    ) {
      return {
        error:
          parentError?.message ??
          "Your parent account could not be found.",
      };
    }

    fullName =
      parent.full_name;

    recordId =
      parent.id;
  }

  const surname =
    getSurname(fullName);

  if (
    surname &&
    password.toLowerCase() ===
      surname
  ) {
    return {
      error:
        "Your new password cannot be your temporary surname password.",
    };
  }

  const {
    error: passwordError,
  } =
    await supabase.auth.updateUser({
      password,
    });

  if (passwordError) {
    return {
      error:
        passwordError.message,
    };
  }

  if (role === "teacher") {
    const {
      error: updateError,
    } = await admin
      .from("teachers")
      .update({
        must_change_password:
          false,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", recordId);

    if (updateError) {
      return {
        error:
          updateError.message,
      };
    }
  }

  if (role === "parent") {
    const {
      error: updateError,
    } = await admin
      .from("parents")
      .update({
        must_change_password:
          false,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", recordId);

    if (updateError) {
      return {
        error:
          updateError.message,
      };
    }
  }

  redirect(
    getDashboardRoute(role),
  );
}
