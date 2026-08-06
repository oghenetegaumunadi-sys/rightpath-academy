"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Save,
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
  Textarea,
} from "@/components/ui";

import {
  saveSchoolProfileAction,
  type SchoolProfileState,
} from "./actions";

type SchoolProfileFormProps = {
  profile: {
    id: string;
    schoolName: string;
    shortName: string;
    motto: string;
    email: string;
    phone: string;
    website: string;
    address: string;
    admissionPrefix: string;
    staffPrefix: string;
    countryCode: string;
    currencyCode: string;
    timezone: string;
  } | null;
};

const initialState: SchoolProfileState = {
  success: false,
  message: null,
};

export function SchoolProfileForm({
  profile,
}: SchoolProfileFormProps) {
  const [state, formAction, pending] =
    useActionState(
      saveSchoolProfileAction,
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
      className="space-y-8"
    >
      <input
        type="hidden"
        name="profileId"
        value={profile?.id ?? ""}
      />

      <section>
        <h2 className="text-lg font-semibold text-slate-950">
          School Identity
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Core information displayed across the platform
          and printed documents.
        </p>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <Label htmlFor="schoolName">
              School name
            </Label>

            <Input
              id="schoolName"
              name="schoolName"
              required
              minLength={3}
              defaultValue={
                profile?.schoolName ??
                "RightPath Academy"
              }
            />
          </div>

          <div>
            <Label htmlFor="shortName">
              Short name
            </Label>

            <Input
              id="shortName"
              name="shortName"
              required
              defaultValue={
                profile?.shortName ?? "RPA"
              }
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="motto">
              School motto
            </Label>

            <Input
              id="motto"
              name="motto"
              defaultValue={profile?.motto ?? ""}
              placeholder="Enter the school motto"
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold text-slate-950">
          Contact Information
        </h2>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <Label htmlFor="email">
              School email
            </Label>

            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={profile?.email ?? ""}
              placeholder="school@example.com"
            />
          </div>

          <div>
            <Label htmlFor="phone">
              Phone number
            </Label>

            <Input
              id="phone"
              name="phone"
              defaultValue={profile?.phone ?? ""}
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="website">
              Website
            </Label>

            <Input
              id="website"
              name="website"
              type="url"
              defaultValue={profile?.website ?? ""}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="lg:col-span-2">
            <Label htmlFor="address">
              School address
            </Label>

            <Textarea
              id="address"
              name="address"
              rows={4}
              defaultValue={profile?.address ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold text-slate-950">
          System Preferences
        </h2>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="admissionPrefix">
              Admission prefix
            </Label>

            <Input
              id="admissionPrefix"
              name="admissionPrefix"
              required
              defaultValue={
                profile?.admissionPrefix ?? "RPA"
              }
            />
          </div>

          <div>
            <Label htmlFor="staffPrefix">
              Staff prefix
            </Label>

            <Input
              id="staffPrefix"
              name="staffPrefix"
              required
              defaultValue={
                profile?.staffPrefix ?? "RPA-STF"
              }
            />
          </div>

          <div>
            <Label htmlFor="countryCode">
              Country code
            </Label>

            <Input
              id="countryCode"
              name="countryCode"
              required
              minLength={2}
              maxLength={2}
              defaultValue={
                profile?.countryCode ?? "NG"
              }
            />
          </div>

          <div>
            <Label htmlFor="currencyCode">
              Currency code
            </Label>

            <Input
              id="currencyCode"
              name="currencyCode"
              required
              minLength={3}
              maxLength={3}
              defaultValue={
                profile?.currencyCode ?? "NGN"
              }
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="timezone">
              Time zone
            </Label>

            <Input
              id="timezone"
              name="timezone"
              required
              defaultValue={
                profile?.timezone ??
                "Africa/Lagos"
              }
            />
          </div>
        </div>
      </section>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />

          <p className="font-semibold">
            School profile saved.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end border-t border-slate-200 pt-6">
        <Button
          type="submit"
          disabled={pending}
          className="min-w-48"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending
            ? "Saving Changes..."
            : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
