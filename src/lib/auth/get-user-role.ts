import { createClient } from "@/lib/supabase/server";

export async function getUserRole(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profile_roles")
    .select(
      `
        roles (
          name
        )
      `,
    )
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Unable to load user role:", error.message);
    return null;
  }

  const roleRelation = data?.roles;

  if (!roleRelation) {
    return null;
  }

  if (Array.isArray(roleRelation)) {
    return roleRelation[0]?.name ?? null;
  }

  return roleRelation.name ?? null;
}
