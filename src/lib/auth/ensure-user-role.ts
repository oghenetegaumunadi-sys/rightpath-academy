import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureUserRole(
  userId: string,
  email: string,
) {
  const admin = createAdminClient();

  const { data: existingRole, error: roleError } = await admin
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
    const relation = existingRole.roles;

    const roleName = Array.isArray(relation)
      ? relation[0]?.name
      : relation?.name;

    return roleName ?? null;
  }

  const { count, error: countError } = await admin
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

  if ((count ?? 0) > 0) {
    return null;
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: userId,
        email,
        full_name: email.split("@")[0],
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

  const { data: principalRole, error: principalError } =
    await admin
      .from("roles")
      .select("id")
      .eq("name", "principal")
      .single();

  if (principalError || !principalRole) {
    throw new Error(
      principalError?.message ??
        "Principal role is missing from the database.",
    );
  }

  const { error: assignmentError } = await admin
    .from("profile_roles")
    .insert({
      profile_id: profile.id,
      role_id: principalRole.id,
      assigned_by: userId,
    });

  if (assignmentError) {
    throw new Error(
      `Unable to assign Principal role: ${assignmentError.message}`,
    );
  }

  return "principal";
}
