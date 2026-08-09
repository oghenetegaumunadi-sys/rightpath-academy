"use client";

import {
  CheckCircle2,
  KeyRound,
  LoaderCircle,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { toast } from "sonner";

import { Button, Card } from "@/components/ui";

import {
  activateParentPortalAction,
  type ActivateParentPortalState,
} from "./actions";

const initialState: ActivateParentPortalState = {
  success: false,
  message: null,
  parentPortalId: null,
  temporaryPassword: null,
};

export function ActivateParentPortalForm({
  parentId,
}: {
  parentId: string;
}) {
  const boundAction =
    activateParentPortalAction.bind(
      null,
      parentId,
    );

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    boundAction,
    initialState,
  );

  useEffect(() => {
    if (
      state.success &&
      state.message
    ) {
      toast.success(state.message);
    } else if (
      !state.success &&
      state.message
    ) {
      toast.error(state.message);
    }
  }, [state]);

  if (state.success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <CheckCircle2 className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold text-green-950">
              Parent Portal Activated
            </h2>

            <p className="mt-3 text-sm text-green-800">
              Parent ID
            </p>

            <p className="mt-1 font-mono text-lg font-bold text-green-950">
              {state.parentPortalId}
            </p>

            <p className="mt-4 text-sm text-green-800">
              Temporary Password
            </p>

            <p className="mt-1 font-mono text-lg font-bold text-green-950">
              {state.temporaryPassword}
            </p>

            <p className="mt-4 text-xs leading-5 text-green-700">
              Give these credentials to the parent securely.
              They will be required to change the temporary
              password after first login.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form action={formAction}>
      <Button
        type="submit"
        disabled={pending}
      >
        {pending ? (
          <LoaderCircle className="size-5 animate-spin" />
        ) : (
          <KeyRound className="size-5" />
        )}

        {pending
          ? "Creating Portal Access..."
          : "Activate Parent Portal"}
      </Button>
    </form>
  );
}
