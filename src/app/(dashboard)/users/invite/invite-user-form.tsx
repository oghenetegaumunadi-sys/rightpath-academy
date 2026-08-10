"use client";

import {
  CheckCircle2,
  Copy,
  LoaderCircle,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";

import {
  Button,
  Input,
  Label,
} from "@/components/ui";

import {
  inviteUserAction,
  type InviteUserState,
} from "./actions";

type RoleOption = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
};

const initialState: InviteUserState = {
  success: false,
  message: null,
  invitedUserId: null,
  temporaryPassword: null,
};

export function InviteUserForm({
  roles,
}: {
  roles: RoleOption[];
}) {
  const [state, formAction, pending] =
    useActionState(
      inviteUserAction,
      initialState,
    );

  const [createdEmail, setCreatedEmail] =
    useState("");

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  function captureEmail(
    formData: FormData,
  ) {
    setCreatedEmail(
      String(
        formData.get("email") ?? "",
      )
        .trim()
        .toLowerCase(),
    );

    formAction(formData);
  }

  async function copyValue(
    value: string,
    label: string,
  ) {
    await navigator.clipboard.writeText(
      value,
    );

    toast.success(
      `${label} copied.`,
    );
  }

  if (state.success) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <CheckCircle2 className="size-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-green-950">
                Account created successfully
              </h2>

              <p className="mt-2 text-sm leading-6 text-green-800">
                Give these login credentials to the user securely.
                They will be required to change the temporary password
                on first login.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <CredentialBox
              label="Login email"
              value={
                createdEmail ||
                "Use the email entered during account creation."
              }
              onCopy={
                createdEmail
                  ? () =>
                      copyValue(
                        createdEmail,
                        "Email",
                      )
                  : undefined
              }
            />

            {state.temporaryPassword ? (
              <CredentialBox
                label="Temporary password"
                value={
                  state.temporaryPassword
                }
                onCopy={() =>
                  copyValue(
                    state.temporaryPassword!,
                    "Temporary password",
                  )
                }
              />
            ) : null}
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">
              Important
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              The temporary password is shown here for account
              setup. Store or share it securely before leaving
              this page.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {state.invitedUserId ? (
            <Link
              href={`/users/${state.invitedUserId}`}
              className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50"
            >
              Open User Account
            </Link>
          ) : null}

          <Link
            href="/users/invite"
            className="inline-flex items-center justify-center rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
          >
            Create Another Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      action={captureEmail}
      className="space-y-7"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <Label htmlFor="fullName">
            Full name
          </Label>

          <Input
            id="fullName"
            name="fullName"
            required
            minLength={3}
            placeholder="Enter the user's full name"
          />
        </div>

        <div>
          <Label htmlFor="email">
            Login email
          </Label>

          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="user@example.com"
          />
        </div>

        <div className="lg:col-span-2">
          <Label htmlFor="phone">
            Phone number
          </Label>

          <Input
            id="phone"
            name="phone"
            placeholder="Optional"
          />
        </div>
      </div>

      <section className="border-t border-slate-200 pt-7">
        <h2 className="text-lg font-semibold text-slate-950">
          Assign Role
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select the role this account should use.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {roles.map((role) => (
            <label
              key={role.id}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
            >
              <input
                type="checkbox"
                name="roleIds"
                value={role.id}
                className="mt-1 size-4 rounded border-slate-300 text-green-700 focus:ring-green-600"
              />

              <span>
                <span className="block font-semibold text-slate-900">
                  {role.displayName}
                </span>

                <span className="mt-1 block text-xs leading-5 text-slate-500">
                  {role.description ??
                    role.name.replaceAll("_", " ")}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <Button
          type="submit"
          disabled={pending}
          className="min-w-52"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <UserPlus className="size-5" />
          )}

          {pending
            ? "Creating Account..."
            : "Create Account"}
        </Button>
      </div>
    </form>
  );
}

function CredentialBox({
  label,
  value,
  onCopy,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
}) {
  return (
    <div className="rounded-xl border border-green-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            {label}
          </p>

          <p className="mt-2 break-all font-mono text-base font-bold text-slate-950">
            {value}
          </p>
        </div>

        {onCopy ? (
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label={`Copy ${label}`}
          >
            <Copy className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
