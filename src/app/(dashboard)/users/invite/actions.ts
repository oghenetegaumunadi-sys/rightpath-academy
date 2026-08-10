"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteUserState = {
  success: boolean;
  message: string | null;
  invitedUserId: string | null;
  temporaryPassword: string | null;
};

function generateTemporaryPassword() {
  return `RAS-${randomBytes(6).toString("base64url")}!`;
}

export async function inviteUserAction(
  _previousState: InviteUserState,
  formData: FormData,
): Promise<InviteUserState> {
  try {
    const fullName = String(
      formData.get("fullName") ?? "",
    ).trim();

    const email = String(
      formData.get("email") ?? "",
    )
      .trim()
      .toLowerCase();

    const phone =
      String(formData.get("phone") ?? "").trim() ||
      null;

    const roleIds = [
      ...new Set(
        formData
          .getAll("roleIds")
          .map(String)
          .filter(Boolean),
      ),
    ];

    if (fullName.length < 3) {
      return {
        success: false,
        message:
          "Enter the user's full name.",
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    if (
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return {
        success: false,
        message:
          "Enter a valid email address.",
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    if (roleIds.length === 0) {
      return {
        success: false,
        message:
          "Assign at least one role.",
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    const supabase = await createClient();

    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !currentUser?.email) {
      return {
        success: false,
        message:
          "Your session has expired. Please sign in again.",
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    const currentRole = await ensureUserRole(
      currentUser.id,
      currentUser.email,
    );

    if (
      !currentRole ||
      ![
        "director",

        // Legacy authority during migration
        "principal",
      ].includes(currentRole)
    ) {
      return {
        success: false,
        message:
          "Only the School Director can create administrative accounts.",
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    const admin = createAdminClient();

    const {
      data: validRoles,
      error: rolesError,
    } = await admin
      .from("roles")
      .select(`
        id,
        name,
        display_name
      `)
      .in("id", roleIds);

    if (rolesError) {
      return {
        success: false,
        message: rolesError.message,
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    if (
      !validRoles ||
      validRoles.length !== roleIds.length
    ) {
      return {
        success: false,
        message:
          "One or more selected roles are invalid.",
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    const selectedRoleNames =
      validRoles.map(
        (role) => role.name,
      );

    const allowedCreatedRoles = [
      "school_admin",
      "head_teacher",
      "teacher",
      "parent",
    ];

    if (
      selectedRoleNames.some(
        (role) =>
          !allowedCreatedRoles.includes(role),
      )
    ) {
      return {
        success: false,
        message:
          "One or more selected roles cannot be created from this screen.",
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    const temporaryPassword =
      generateTemporaryPassword();

    const {
      data: authData,
      error: createError,
    } = await admin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone,
        must_change_password: true,
      },
    });

    if (
      createError ||
      !authData.user
    ) {
      return {
        success: false,
        message:
          createError?.message ??
          "The user account could not be created.",
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    const createdUser =
      authData.user;

    const {
      error: profileError,
    } = await admin
      .from("profiles")
      .upsert(
        {
          id: createdUser.id,
          email,
          full_name: fullName,
          phone,
          status: "active",
          updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      await admin.auth.admin.deleteUser(
        createdUser.id,
      );

      return {
        success: false,
        message:
          `Unable to create the user profile: ${profileError.message}`,
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    const {
      error: roleInsertError,
    } = await admin
      .from("profile_roles")
      .upsert(
        roleIds.map((roleId) => ({
          profile_id:
            createdUser.id,
          role_id:
            roleId,
          assigned_by:
            currentUser.id,
        })),
        {
          onConflict:
            "profile_id,role_id",
          ignoreDuplicates: true,
        },
      );

    if (roleInsertError) {
      await admin
        .from("profiles")
        .delete()
        .eq(
          "id",
          createdUser.id,
        );

      await admin.auth.admin.deleteUser(
        createdUser.id,
      );

      return {
        success: false,
        message:
          `Unable to assign the user's role: ${roleInsertError.message}`,
        invitedUserId: null,
        temporaryPassword: null,
      };
    }

    revalidatePath("/users");
    revalidatePath(
      `/users/${createdUser.id}`,
    );
    revalidatePath("/settings");

    return {
      success: true,
      message:
        "User account created successfully.",
      invitedUserId:
        createdUser.id,
      temporaryPassword,
    };
  } catch (error) {
    console.error(
      "Unexpected user creation error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected user creation error occurred.",
      invitedUserId: null,
      temporaryPassword: null,
    };
  }
}
