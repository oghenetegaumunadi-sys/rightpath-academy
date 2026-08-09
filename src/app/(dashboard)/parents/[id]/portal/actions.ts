"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ActivateParentPortalState = {
  success: boolean;
  message: string | null;
  parentPortalId: string | null;
  temporaryPassword: string | null;
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

function makeParentAuthEmail(
  parentPortalId: string,
) {
  const safeId = parentPortalId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeId}@parents.rightpath.local`;
}

export async function activateParentPortalAction(
  parentId: string,
  _previousState: ActivateParentPortalState,
): Promise<ActivateParentPortalState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      success: false,
      message:
        "Your session has expired. Please sign in again.",
      parentPortalId: null,
      temporaryPassword: null,
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
        "Your account cannot create parent portal credentials.",
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  const admin = createAdminClient();

  const {
    data: parent,
    error: parentError,
  } = await admin
    .from("parents")
    .select(`
      id,
      full_name,
      phone,
      email,
      status,
      profile_id,
      parent_portal_id
    `)
    .eq("id", parentId)
    .maybeSingle();

  if (parentError || !parent) {
    return {
      success: false,
      message:
        parentError?.message ??
        "Parent record could not be found.",
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  if (parent.status !== "active") {
    return {
      success: false,
      message:
        "Only active parent records can receive portal access.",
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  if (
    parent.profile_id &&
    parent.parent_portal_id
  ) {
    return {
      success: false,
      message:
        "This parent already has an active portal account.",
      parentPortalId:
        parent.parent_portal_id,
      temporaryPassword: null,
    };
  }

  const {
    data: generatedId,
    error: idError,
  } = await admin.rpc(
    "generate_parent_portal_id",
  );

  if (
    idError ||
    !generatedId
  ) {
    return {
      success: false,
      message:
        idError?.message ??
        "Unable to generate the Parent ID.",
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  const parentPortalId =
    String(generatedId);

  const temporaryPassword =
    getSurname(parent.full_name);

  if (!temporaryPassword) {
    return {
      success: false,
      message:
        "Unable to determine a temporary password from the parent's name.",
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  const authEmail =
    makeParentAuthEmail(
      parentPortalId,
    );

  const {
    data: authData,
    error: authError,
  } =
    await admin.auth.admin.createUser({
      email: authEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name:
          parent.full_name,
        parent_portal_id:
          parentPortalId,
        account_type:
          "parent",
      },
    });

  if (
    authError ||
    !authData.user
  ) {
    console.error(
      "Parent auth creation failed:",
      authError,
    );

    return {
      success: false,
      message:
        authError?.message ??
        "Unable to create the parent login account.",
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  const profileId =
    authData.user.id;

  const {
    error: profileError,
  } = await admin
    .from("profiles")
    .upsert({
      id: profileId,
      email: authEmail,
      full_name:
        parent.full_name,
      phone: parent.phone,
      status: "active",
      updated_at:
        new Date().toISOString(),
    });

  if (profileError) {
    await admin.auth.admin.deleteUser(
      profileId,
    );

    return {
      success: false,
      message:
        `Unable to create the parent profile: ${profileError.message}`,
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  const {
    data: parentRole,
    error: roleError,
  } = await admin
    .from("roles")
    .select("id")
    .eq("name", "parent")
    .maybeSingle();

  if (
    roleError ||
    !parentRole
  ) {
    return {
      success: false,
      message:
        roleError?.message ??
        "The parent role has not been configured.",
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  const {
    data: existingRole,
  } = await admin
    .from("profile_roles")
    .select(`
      profile_id,
      role_id
    `)
    .eq(
      "profile_id",
      profileId,
    )
    .eq(
      "role_id",
      parentRole.id,
    )
    .maybeSingle();

  if (!existingRole) {
    const {
      error: profileRoleError,
    } = await admin
      .from("profile_roles")
      .insert({
        profile_id:
          profileId,
        role_id:
          parentRole.id,
        assigned_by:
          user.id,
      });

    if (profileRoleError) {
      return {
        success: false,
        message:
          `Unable to assign the parent role: ${profileRoleError.message}`,
        parentPortalId: null,
        temporaryPassword: null,
      };
    }
  }

  const {
    error: updateError,
  } = await admin
    .from("parents")
    .update({
      profile_id:
        profileId,
      parent_portal_id:
        parentPortalId,
      must_change_password:
        true,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", parent.id);

  if (updateError) {
    return {
      success: false,
      message:
        updateError.message,
      parentPortalId: null,
      temporaryPassword: null,
    };
  }

  revalidatePath(
    `/parents/${parent.id}/portal`,
  );
  revalidatePath(
    `/students`,
  );

  return {
    success: true,
    message:
      "Parent portal account created successfully.",
    parentPortalId,
    temporaryPassword,
  };
}
