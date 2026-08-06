"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserManagementState = {
  success: boolean;
  message: string | null;
};

async function authorizeUserManager() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return {
      user: null,
      error:
        "Your session has expired. Please sign in again.",
    };
  }

  const role = await ensureUserRole(
    user.id,
    user.email,
  );

  if (
    !role ||
    !["principal", "vice_principal", "admin"].includes(
      role,
    )
  ) {
    return {
      user: null,
      error:
        "Your account cannot manage system users.",
    };
  }

  return {
    user,
    error: null,
  };
}

export async function updateUserStatusAction(
  _previousState: UserManagementState,
  formData: FormData,
): Promise<UserManagementState> {
  const profileId = String(
    formData.get("profileId") ?? "",
  ).trim();

  const status = String(
    formData.get("status") ?? "",
  ).trim();

  if (!profileId) {
    return {
      success: false,
      message: "Invalid user profile.",
    };
  }

  if (
    !["active", "inactive", "suspended"].includes(
      status,
    )
  ) {
    return {
      success: false,
      message: "Invalid account status.",
    };
  }

  const authorization =
    await authorizeUserManager();

  if (!authorization.user) {
    return {
      success: false,
      message: authorization.error,
    };
  }

  if (
    authorization.user.id === profileId &&
    status !== "active"
  ) {
    return {
      success: false,
      message:
        "You cannot suspend or deactivate your own account.",
    };
  }

  const admin = createAdminClient();

  const {
    data: updatedProfile,
    error,
  } = await admin
    .from("profiles")
    .update({
      status:
        status as
          | "active"
          | "inactive"
          | "suspended",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select("id")
    .maybeSingle();

  if (error || !updatedProfile) {
    return {
      success: false,
      message:
        error?.message ??
        "The user status could not be updated.",
    };
  }

  revalidatePath("/users");
  revalidatePath(`/users/${profileId}`);
  revalidatePath("/settings");
  revalidatePath("/settings/users");
  revalidatePath("/dashboard/principal");

  return {
    success: true,
    message: `User account marked as ${status}.`,
  };
}

export async function updateUserRolesAction(
  _previousState: UserManagementState,
  formData: FormData,
): Promise<UserManagementState> {
  const profileId = String(
    formData.get("profileId") ?? "",
  ).trim();

  const roleIds = [
    ...new Set(
      formData
        .getAll("roleIds")
        .map(String)
        .filter(Boolean),
    ),
  ];

  if (!profileId) {
    return {
      success: false,
      message: "Invalid user profile.",
    };
  }

  if (roleIds.length === 0) {
    return {
      success: false,
      message:
        "Assign at least one role to the user.",
    };
  }

  const authorization =
    await authorizeUserManager();

  if (!authorization.user) {
    return {
      success: false,
      message: authorization.error,
    };
  }

  const admin = createAdminClient();

  const {
    data: validRoles,
    error: roleError,
  } = await admin
    .from("roles")
    .select("id, name")
    .in("id", roleIds);

  if (roleError) {
    return {
      success: false,
      message: roleError.message,
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
    };
  }

  if (authorization.user.id === profileId) {
    const retainsManagerRole = validRoles.some(
      (role) =>
        [
          "principal",
          "vice_principal",
          "admin",
        ].includes(role.name),
    );

    if (!retainsManagerRole) {
      return {
        success: false,
        message:
          "You cannot remove all administrative roles from your own account.",
      };
    }
  }

  const {
    data: currentRoles,
    error: currentRoleError,
  } = await admin
    .from("profile_roles")
    .select("role_id")
    .eq("profile_id", profileId);

  if (currentRoleError) {
    return {
      success: false,
      message: currentRoleError.message,
    };
  }

  const currentRoleIds = new Set(
    currentRoles?.map((role) => role.role_id) ?? [],
  );

  const selectedRoleIds = new Set(roleIds);

  const roleIdsToDelete = [
    ...currentRoleIds,
  ].filter(
    (roleId) => !selectedRoleIds.has(roleId),
  );

  const roleIdsToInsert = roleIds.filter(
    (roleId) => !currentRoleIds.has(roleId),
  );

  if (roleIdsToDelete.length > 0) {
    const { error: deleteError } = await admin
      .from("profile_roles")
      .delete()
      .eq("profile_id", profileId)
      .in("role_id", roleIdsToDelete);

    if (deleteError) {
      return {
        success: false,
        message: deleteError.message,
      };
    }
  }

  if (roleIdsToInsert.length > 0) {
    const { error: insertError } = await admin
      .from("profile_roles")
      .insert(
        roleIdsToInsert.map((roleId) => ({
          profile_id: profileId,
          role_id: roleId,
          assigned_by: authorization.user!.id,
        })),
      );

    if (insertError) {
      return {
        success: false,
        message: insertError.message,
      };
    }
  }

  revalidatePath("/users");
  revalidatePath(`/users/${profileId}`);
  revalidatePath("/settings");
  revalidatePath("/settings/users");
  revalidatePath("/dashboard/principal");

  return {
    success: true,
    message: "User roles updated successfully.",
  };
}
