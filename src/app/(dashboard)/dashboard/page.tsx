import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getUserRole } from "@/lib/auth/get-user-role";
import { getDashboardRoute } from "@/lib/auth/roles";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const role = await getUserRole(user.id);
  const destination = getDashboardRoute(role);

  if (destination === "/dashboard") {
    redirect("/unauthorized");
  }

  redirect(destination);
}
