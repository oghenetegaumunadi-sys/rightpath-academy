export const DASHBOARD_ROUTES = {
  // New school hierarchy
  director: "/dashboard/director",
  school_admin: "/dashboard/admin",
  head_teacher: "/head-teacher",

  // Teaching and family portals
  teacher: "/teacher",
  parent: "/parent",

  // Legacy roles kept temporarily during migration
  principal: "/dashboard/principal",
  vice_principal: "/dashboard/vice-principal",
  admin: "/dashboard/admin",

  // Deferred modules
  accountant: "/dashboard/accountant",
  librarian: "/dashboard/librarian",
} as const;

export type AppRole =
  keyof typeof DASHBOARD_ROUTES;

export function isAppRole(
  value: string,
): value is AppRole {
  return value in DASHBOARD_ROUTES;
}

export function getDashboardRoute(
  role: string | null,
) {
  if (
    !role ||
    !isAppRole(role)
  ) {
    return "/dashboard";
  }

  return DASHBOARD_ROUTES[role];
}

/**
 * Roles with full-school executive authority.
 *
 * `principal` remains temporarily for existing
 * production accounts during migration.
 */
export const DIRECTOR_ROLES = [
  "director",
  "principal",
] as const;

/**
 * Roles allowed to manage normal day-to-day
 * school administration.
 *
 * Legacy roles remain here until their accounts
 * have been migrated.
 */
export const SCHOOL_MANAGEMENT_ROLES = [
  "director",
  "school_admin",
  "principal",
  "vice_principal",
  "admin",
] as const;

/**
 * Roles involved in academic/teaching workflows.
 */
export const ACADEMIC_STAFF_ROLES = [
  "director",
  "school_admin",
  "head_teacher",
  "teacher",
  "principal",
  "vice_principal",
  "admin",
] as const;

export function isDirectorRole(
  role: string | null,
) {
  return Boolean(
    role &&
      DIRECTOR_ROLES.includes(
        role as
          (typeof DIRECTOR_ROLES)[number],
      ),
  );
}

export function isSchoolManagementRole(
  role: string | null,
) {
  return Boolean(
    role &&
      SCHOOL_MANAGEMENT_ROLES.includes(
        role as
          (typeof SCHOOL_MANAGEMENT_ROLES)[number],
      ),
  );
}

export function isAcademicStaffRole(
  role: string | null,
) {
  return Boolean(
    role &&
      ACADEMIC_STAFF_ROLES.includes(
        role as
          (typeof ACADEMIC_STAFF_ROLES)[number],
      ),
  );
}
