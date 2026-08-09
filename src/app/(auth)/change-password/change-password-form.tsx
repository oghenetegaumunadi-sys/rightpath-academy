"use client";

import {
  LoaderCircle,
  LockKeyhole,
} from "lucide-react";
import { useActionState } from "react";

import {
  changePasswordAction,
  type ChangePasswordState,
} from "./actions";

const initialState: ChangePasswordState = {
  error: null,
};

export function ChangePasswordForm() {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    changePasswordAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mt-8 space-y-5"
    >
      {state.error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          New password
        </label>

        <div className="relative">
          <LockKeyhole className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />

          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Confirm password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repeat your new password"
          className="w-full rounded-xl border border-slate-200 bg-white py-3.5 px-4 outline-none transition focus:border-green-600 focus:ring-4 focus:ring-green-100"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3.5 font-bold text-white transition hover:bg-green-800 disabled:opacity-60"
      >
        {pending ? (
          <>
            <LoaderCircle className="size-5 animate-spin" />
            Updating...
          </>
        ) : (
          "Create New Password"
        )}
      </button>
    </form>
  );
}
