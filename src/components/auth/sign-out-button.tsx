"use client";

import {
  LogOut,
  LoaderCircle,
} from "lucide-react";
import { useFormStatus } from "react-dom";

import { signOutAction } from "./sign-out-action";

function SignOutSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-green-50 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle className="size-5 animate-spin" />
      ) : (
        <LogOut className="size-5 text-green-200" />
      )}

      {pending ? "Signing out..." : "Sign Out"}
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <SignOutSubmitButton />
    </form>
  );
}
