"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Save,
  ShieldAlert,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Button,
  Card,
  Label,
  Select,
} from "@/components/ui";

import {
  updateUserRolesAction,
  updateUserStatusAction,
  type UserManagementState,
} from "./actions";

const initialState: UserManagementState = {
  success: false,
  message: null,
};

type RoleOption = {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
};

export function UserControls({
  profileId,
  currentStatus,
  roles,
  assignedRoleIds,
}: {
  profileId: string;
  currentStatus: string;
  roles: RoleOption[];
  assignedRoleIds: string[];
}) {
  const router = useRouter();

  const [
    statusState,
    statusAction,
    updatingStatus,
  ] = useActionState(
    updateUserStatusAction,
    initialState,
  );

  const [
    rolesState,
    rolesAction,
    updatingRoles,
  ] = useActionState(
    updateUserRolesAction,
    initialState,
  );

  useEffect(() => {
    if (statusState.success && statusState.message) {
      toast.success(statusState.message);
      router.refresh();
    } else if (
      !statusState.success &&
      statusState.message
    ) {
      toast.error(statusState.message);
    }
  }, [statusState, router]);

  useEffect(() => {
    if (rolesState.success && rolesState.message) {
      toast.success(rolesState.message);
      router.refresh();
    } else if (
      !rolesState.success &&
      rolesState.message
    ) {
      toast.error(rolesState.message);
    }
  }, [rolesState, router]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <CheckCircle2 className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Account Status
            </h2>

            <p className="text-sm text-slate-500">
              Control access to the platform.
            </p>
          </div>
        </div>

        <form
          action={statusAction}
          className="mt-6 space-y-4"
        >
          <input
            type="hidden"
            name="profileId"
            value={profileId}
          />

          <div>
            <Label htmlFor="status">
              Status
            </Label>

            <Select
              id="status"
              name="status"
              defaultValue={currentStatus}
            >
              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>

              <option value="suspended">
                Suspended
              </option>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={updatingStatus}
            className="w-full"
          >
            {updatingStatus ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Save className="size-5" />
            )}

            {updatingStatus
              ? "Updating Status..."
              : "Update Status"}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ShieldAlert className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              User Roles
            </h2>

            <p className="text-sm text-slate-500">
              Select every role assigned to this user.
            </p>
          </div>
        </div>

        <form
          action={rolesAction}
          className="mt-6 space-y-4"
        >
          <input
            type="hidden"
            name="profileId"
            value={profileId}
          />

          <div className="space-y-3">
            {roles.map((role) => (
              <label
                key={role.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
              >
                <input
                  type="checkbox"
                  name="roleIds"
                  value={role.id}
                  defaultChecked={assignedRoleIds.includes(
                    role.id,
                  )}
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

          <Button
            type="submit"
            disabled={updatingRoles}
            className="w-full"
          >
            {updatingRoles ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Save className="size-5" />
            )}

            {updatingRoles
              ? "Updating Roles..."
              : "Update Roles"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
