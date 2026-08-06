export const DASHBOARD_ROUTES = {
  principal: "/dashboard/principal",
  vice_principal: "/dashboard/vice-principal",
  admin: "/dashboard/admin",
  teacher: "/dashboard/teacher",
  accountant: "/dashboard/accountant",
  librarian: "/dashboard/librarian",
  parent: "/dashboard/parent",
} as const;

export type AppRole = keyof typeof DASHBOARD_ROUTES;

export function isAppRole(value: string): value is AppRole {
  return value in DASHBOARD_ROUTES;
}

export function getDashboardRoute(role: string | null) {
  if (!role || !isAppRole(role)) {
    return "/dashboard";
  }

  return DASHBOARD_ROUTES[role];
}
