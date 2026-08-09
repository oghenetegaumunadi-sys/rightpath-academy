"use server";

import { redirect } from "next/navigation";

import { getDashboardRoute } from "@/lib/auth/roles";
import { getUserRole } from "@/lib/auth/get-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

function makeParentAuthEmail(
  parentPortalId: string,
) {
  const safeId = parentPortalId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeId}@parents.rightpath.local`;
}

function makeTeacherAuthEmail(employeeId: string) {
  const safeId = employeeId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeId}@staff.rightpath.local`;
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(
    formData.get("identifier") ?? "",
  )
    .trim()
    .toLowerCase();

  const password = String(
    formData.get("password") ?? "",
  );

  if (!identifier || !password) {
    return {
      error:
        "Enter your Staff ID, Parent ID or email address and password.",
    };
  }

  let authEmail = identifier;

  // If it isn't an email address, treat it as a teacher Staff ID.
  if (!identifier.includes("@")) {
    const admin = createAdminClient();

    if (
      identifier
        .toUpperCase()
        .includes("/PAR/")
    ) {
      const {
        data: parent,
        error: parentError,
      } = await admin
        .from("parents")
        .select(`
          id,
          parent_portal_id,
          status,
          profile_id
        `)
        .ilike(
          "parent_portal_id",
          identifier,
        )
        .maybeSingle();

      if (
        parentError ||
        !parent ||
        parent.status !== "active" ||
        !parent.parent_portal_id
      ) {
        return {
          error:
            "The Parent ID or password is incorrect.",
        };
      }

      authEmail = makeParentAuthEmail(
        parent.parent_portal_id,
      );
    } else {
      const {
        data: teacher,
        error: teacherError,
      } = await admin
        .from("teachers")
        .select(`
          id,
          employee_id,
          status,
          profile_id
        `)
        .ilike(
          "employee_id",
          identifier,
        )
        .maybeSingle();

      if (
        teacherError ||
        !teacher ||
        teacher.status !== "active"
      ) {
        return {
          error:
            "The Staff ID or password is incorrect.",
        };
      }

      authEmail = makeTeacherAuthEmail(
        teacher.employee_id,
      );
    }
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

  if (error || !data.user) {
    const isParentId =
      !identifier.includes("@") &&
      identifier
        .toUpperCase()
        .includes("/PAR/");

    return {
      error:
        error?.message ===
        "Invalid login credentials"
          ? identifier.includes("@")
            ? "The email address or password is incorrect."
            : isParentId
              ? "The Parent ID or password is incorrect."
              : "The Staff ID or password is incorrect."
          : error?.message ??
            "Unable to sign in.",
    };
  }

  const role = await getUserRole(
    data.user.id,
  );

  if (
    role === "teacher" ||
    role === "parent"
  ) {
    const admin = createAdminClient();

    if (role === "teacher") {
      const {
        data: teacher,
        error: teacherError,
      } = await admin
        .from("teachers")
        .select(`
          id,
          must_change_password
        `)
        .eq("profile_id", data.user.id)
        .maybeSingle();

      if (teacherError) {
        console.error(
          "Unable to verify teacher login status:",
          {
            message: teacherError.message,
            code: teacherError.code,
            details: teacherError.details,
            hint: teacherError.hint,
          },
        );
      }

      if (
        teacher?.must_change_password
      ) {
        redirect("/change-password");
      }
    }

    if (role === "parent") {
      const {
        data: parent,
        error: parentError,
      } = await admin
        .from("parents")
        .select(`
          id,
          must_change_password
        `)
        .eq("profile_id", data.user.id)
        .maybeSingle();

      if (parentError) {
        console.error(
          "Unable to verify parent login status:",
          {
            message: parentError.message,
            code: parentError.code,
            details: parentError.details,
            hint: parentError.hint,
          },
        );
      }

      if (
        parent?.must_change_password
      ) {
        redirect("/change-password");
      }
    }
  }

  redirect(getDashboardRoute(role));
}
