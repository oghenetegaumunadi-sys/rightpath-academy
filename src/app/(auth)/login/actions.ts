"use server";

import { redirect } from "next/navigation";

import { getDashboardRoute } from "@/lib/auth/roles";
import { getUserRole } from "@/lib/auth/get-user-role";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error: string | null;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Enter your email address and password.",
    };
  }

  const supabase = await createClient();

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error || !data.user) {
    return {
      error:
        error?.message === "Invalid login credentials"
          ? "The email address or password is incorrect."
          : error?.message ?? "Unable to sign in.",
    };
  }

  const role = await getUserRole(data.user.id);

  redirect(getDashboardRoute(role));
}
