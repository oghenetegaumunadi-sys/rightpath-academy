import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureUserRole(
  userId: string,
  email: string,
) {
  const admin = createAdminClient();

  const {
    data: existingRole,
    error: roleError,
  } = await admin
    .from("profile_roles")
    .select(`
      role_id,
      roles (
        name
      )
    `)
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  if (roleError) {
    throw new Error(
      `Unable to check user role: ${roleError.message}`,
    );
  }

  if (existingRole) {
    const relation =
      existingRole.roles;

    const roleName =
      Array.isArray(relation)
        ? relation[0]?.name
        : relation?.name;

    return roleName ?? null;
  }

  const {
    count,
    error: countError,
  } = await admin
    .from("profile_roles")
    .select("*", {
      count: "exact",
      head: true,
    });

  if (countError) {
    throw new Error(
      `Unable to count role assignments: ${countError.message}`,
    );
  }

  /*
   * Bootstrap rule:
   *
   * Only when absolutely no role assignment exists
   * in the entire system may the first authenticated
   * account become School Director automatically.
   *
   * Once the system has any assigned user roles,
   * unassigned accounts must be provisioned by an
   * authorized administrator.
   */
  if ((count ?? 0) > 0) {
    return null;
  }

  const {
    data: profile,
    error: profileError,
  } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name:
          email.split("@")[0],
        status: "active",
      },
      {
        onConflict: "id",
      },
    )
    .select("id")
    .single();

  if (profileError) {
    throw new Error(
      `Unable to create user profile: ${profileError.message}`,
    );
  }

  const {
    data: directorRole,
    error: directorError,
  } = await admin
    .from("roles")
    .select("id")
    .eq("name", "director")
    .single();

  if (
    directorError ||
    !directorRole
  ) {
    throw new Error(
      directorError?.message ??
        "School Director role is missing from the database.",
    );
  }

  const {
    error: assignmentError,
  } = await admin
    .from("profile_roles")
    .insert({
      profile_id:
        profile.id,
      role_id:
        directorRole.id,
      assigned_by:
        userId,
    });

  if (assignmentError) {
    throw new Error(
      `Unable to assign School Director role: ${assignmentError.message}`,
    );
  }

  return "director";
}
