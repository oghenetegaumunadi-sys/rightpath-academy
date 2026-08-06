"use client";

import {
  CheckCircle2,
  LoaderCircle,
  MailPlus,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import Link from "next/link";
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

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form
      action={formAction}
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
            Email address
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
          Assign Roles
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select every role this user should have.
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

      {state.success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-3 text-green-800">
            <CheckCircle2 className="size-5" />

            <p className="font-semibold">
              Invitation sent successfully.
            </p>
          </div>

          {state.invitedUserId ? (
            <Link
              href={`/users/${state.invitedUserId}`}
              className="mt-4 inline-flex text-sm font-semibold text-green-700 hover:text-green-800"
            >
              Open invited user
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <Button
          type="submit"
          disabled={pending}
          className="min-w-52"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <MailPlus className="size-5" />
          )}

          {pending
            ? "Sending Invitation..."
            : "Send Invitation"}
        </Button>
      </div>
    </form>
  );
}
