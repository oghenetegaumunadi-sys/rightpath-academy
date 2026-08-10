"use client";

import {
  LoaderCircle,
  Megaphone,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { toast } from "sonner";

import {
  Button,
  Input,
  Label,
} from "@/components/ui";

import {
  createAnnouncementAction,
  type AnnouncementState,
} from "./actions";

const initialState: AnnouncementState = {
  success: false,
  message: null,
};

export function AnnouncementForm() {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    createAnnouncementAction,
    initialState,
  );

  useEffect(() => {
    if (
      state.success &&
      state.message
    ) {
      toast.success(
        state.message,
      );
    } else if (
      !state.success &&
      state.message
    ) {
      toast.error(
        state.message,
      );
    }
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="title">
          Announcement title
        </Label>

        <Input
          id="title"
          name="title"
          required
          minLength={3}
          placeholder="e.g. Parent–Teacher Meeting"
        />
      </div>

      <div>
        <Label htmlFor="body">
          Message
        </Label>

        <textarea
          id="body"
          name="body"
          required
          minLength={5}
          rows={7}
          placeholder="Write the announcement parents should receive..."
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Label htmlFor="startsAt">
            Starts at
          </Label>

          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
          />

          <p className="mt-2 text-xs text-slate-500">
            Leave empty to start immediately.
          </p>
        </div>

        <div>
          <Label htmlFor="expiresAt">
            Expires at
          </Label>

          <Input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
          />

          <p className="mt-2 text-xs text-slate-500">
            Optional. Leave empty if the notice should remain available.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <input
          type="checkbox"
          name="publishNow"
          defaultChecked
          className="mt-1 size-4 rounded border-slate-300 text-green-700 focus:ring-green-600"
        />

        <span>
          <span className="block font-semibold text-green-950">
            Publish immediately
          </span>

          <span className="mt-1 block text-sm text-green-800">
            Parents will see this announcement in their portal once its start time is reached.
          </span>
        </span>
      </label>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="min-w-48"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Megaphone className="size-5" />
          )}

          {pending
            ? "Saving..."
            : "Save Announcement"}
        </Button>
      </div>
    </form>
  );
}
