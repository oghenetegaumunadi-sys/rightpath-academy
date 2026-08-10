"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type InviteUserState = {
  success: boolean;
  message: string | null;
  invitedUserId: string | null;
};

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
      };
    }

    if (roleIds.length === 0) {
      return {
        success: false,
        message:
          "Assign at least one role.",
        invitedUserId: null,
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
        "school_admin",

        // Legacy roles retained temporarily
        "principal",
        "vice_principal",
        "admin",
      ].includes(currentRole)
    ) {
      return {
        success: false,
        message:
          "Your account cannot invite users.",
        invitedUserId: null,
      };
    }

    const admin = createAdminClient();

    const {
      data: validRoles,
      error: rolesError,
    } = await admin
      .from("roles")
      .select("id, name, display_name")
      .in("id", roleIds);

    if (rolesError) {
      return {
        success: false,
        message: rolesError.message,
        invitedUserId: null,
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
      };
    }


    const selectedRoleNames =
      validRoles.map((role) => role.name);

    /*
     * School hierarchy rules:
     *
     * - Only the School Director may create another
     *   Director or School Administrator.
     *
     * - School Admin may later create operational
     *   accounts such as Head Teachers and Teachers.
     *
     * Legacy Principal retains Director authority
     * temporarily during migration.
     */
    const hasExecutiveRole =
      selectedRoleNames.some((roleName) =>
        [
          "director",
          "school_admin",
        ].includes(roleName),
      );

    const hasDirectorAuthority =
      [
        "director",
        "principal",
      ].includes(currentRole);

    if (
      hasExecutiveRole &&
      !hasDirectorAuthority
    ) {
      return {
        success: false,
        message:
          "Only the School Director can create Director or School Administrator accounts.",
        invitedUserId: null,
      };
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(
        /\/$/,
        "",
      ) ?? "";

    const redirectTo = siteUrl
      ? `${siteUrl}/login`
      : undefined;

    const {
      data: inviteData,
      error: inviteError,
    } =
      await admin.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: fullName,
            phone,
          },
          redirectTo,
        },
      );

    if (inviteError || !inviteData.user) {
      return {
        success: false,
        message:
          inviteError?.message ??
          "The invitation could not be sent.",
        invitedUserId: null,
      };
    }

    const invitedUser = inviteData.user;

    const {
      error: profileError,
    } = await admin
      .from("profiles")
      .upsert(
        {
          id: invitedUser.id,
          email,
          full_name: fullName,
          phone,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      console.error(
        "Invitation sent but profile creation failed:",
        {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        },
      );

      return {
        success: false,
        message:
          "The invitation email was sent, but the user profile could not be completed. Open User Management and repair the account.",
        invitedUserId: invitedUser.id,
      };
    }

    const {
      error: roleInsertError,
    } = await admin
      .from("profile_roles")
      .upsert(
        roleIds.map((roleId) => ({
          profile_id: invitedUser.id,
          role_id: roleId,
          assigned_by: currentUser.id,
        })),
        {
          onConflict: "profile_id,role_id",
          ignoreDuplicates: true,
        },
      );

    if (roleInsertError) {
      console.error(
        "Invitation sent but role assignment failed:",
        {
          message: roleInsertError.message,
          code: roleInsertError.code,
          details: roleInsertError.details,
          hint: roleInsertError.hint,
        },
      );

      return {
        success: false,
        message:
          "The invitation email was sent, but the roles could not be assigned. Open the user account and assign roles manually.",
        invitedUserId: invitedUser.id,
      };
    }

    revalidatePath("/users");
    revalidatePath(`/users/${invitedUser.id}`);
    revalidatePath("/settings");

    return {
      success: true,
      message:
        `Invitation sent to ${email}.`,
      invitedUserId: invitedUser.id,
    };
  } catch (error) {
    console.error(
      "Unexpected user invitation error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected invitation error occurred.",
      invitedUserId: null,
    };
  }
}
