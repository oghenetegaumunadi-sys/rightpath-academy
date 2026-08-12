import { createClient } from "@/lib/supabase/server";

const ROLE_PRIORITY = [
  "director",
  "school_admin",
  "head_teacher",
  "teacher",
  "parent",

  // Legacy roles retained during migration
  "principal",
  "vice_principal",
  "admin",

  // Deferred roles
  "accountant",
  "librarian",
] as const;

export async function getUserRole(
  userId: string,
) {
  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("profile_roles")
    .select(`
      roles (
        name
      )
    `)
    .eq(
      "profile_id",
      userId,
    );

  if (error) {
    console.error(
      "Unable to load user roles:",
      error.message,
    );

    return null;
  }

  const roleNames =
    data
      ?.flatMap((item) => {
        const relation =
          item.roles;

        if (!relation) {
          return [];
        }

        if (
          Array.isArray(
            relation,
          )
        ) {
          return relation
            .map(
              (role) =>
                role?.name,
            )
            .filter(
              (
                role,
              ): role is string =>
                Boolean(role),
            );
        }

        return relation.name
          ? [
              relation.name,
            ]
          : [];
      }) ?? [];

  for (
    const role of
    ROLE_PRIORITY
  ) {
    if (
      roleNames.includes(
        role,
      )
    ) {
      return role;
    }
  }

  return (
    roleNames[0] ??
    null
  );
}
