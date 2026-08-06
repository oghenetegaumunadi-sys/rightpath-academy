"use client";

import {
  CheckCircle2,
  LoaderCircle,
  XCircle,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { toast } from "sonner";

import {
  Button,
  Card,
  Label,
  Textarea,
} from "@/components/ui";

import {
  approveResultSheetAction,
  rejectResultSheetAction,
  type ReviewResultState,
} from "./actions";

const initialState: ReviewResultState = {
  success: false,
  message: null,
};

export function ReviewControls({
  sheetId,
  status,
}: {
  sheetId: string;
  status: string;
}) {
  const [
    approvalState,
    approvalAction,
    approving,
  ] = useActionState(
    approveResultSheetAction,
    initialState,
  );

  const [
    rejectionState,
    rejectionAction,
    rejecting,
  ] = useActionState(
    rejectResultSheetAction,
    initialState,
  );

  useEffect(() => {
    if (
      !approvalState.success &&
      approvalState.message
    ) {
      toast.error(approvalState.message);
    }
  }, [approvalState]);

  useEffect(() => {
    if (
      !rejectionState.success &&
      rejectionState.message
    ) {
      toast.error(rejectionState.message);
    }
  }, [rejectionState]);

  if (status !== "submitted") {
    return (
      <Card
        className={
          status === "approved"
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }
      >
        <p
          className={
            status === "approved"
              ? "font-semibold text-green-900"
              : "font-semibold text-amber-900"
          }
        >
          This result sheet is {status}.
        </p>

        <p
          className={
            status === "approved"
              ? "mt-2 text-sm text-green-700"
              : "mt-2 text-sm text-amber-700"
          }
        >
          No further review action is currently
          available.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-green-200 bg-green-50">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-green-600 text-white">
            <CheckCircle2 className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold text-green-950">
              Approve Results
            </h2>

            <p className="text-sm text-green-700">
              Confirm that all scores are correct.
            </p>
          </div>
        </div>

        <form
          action={approvalAction}
          className="mt-6"
        >
          <input
            type="hidden"
            name="sheetId"
            value={sheetId}
          />

          <Button
            type="submit"
            disabled={approving || rejecting}
            className="w-full"
          >
            {approving ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <CheckCircle2 className="size-5" />
            )}

            {approving
              ? "Approving..."
              : "Approve Result Sheet"}
          </Button>
        </form>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-red-600 text-white">
            <XCircle className="size-5" />
          </div>

          <div>
            <h2 className="font-semibold text-red-950">
              Reject Results
            </h2>

            <p className="text-sm text-red-700">
              Return the sheet to the teacher for
              correction.
            </p>
          </div>
        </div>

        <form
          action={rejectionAction}
          className="mt-6 space-y-4"
        >
          <input
            type="hidden"
            name="sheetId"
            value={sheetId}
          />

          <div>
            <Label htmlFor="rejectionReason">
              Rejection reason
            </Label>

            <Textarea
              id="rejectionReason"
              name="rejectionReason"
              rows={4}
              required
              minLength={5}
              placeholder="Explain what the teacher needs to correct."
            />
          </div>

          <Button
            type="submit"
            variant="destructive"
            disabled={approving || rejecting}
            className="w-full"
          >
            {rejecting ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <XCircle className="size-5" />
            )}

            {rejecting
              ? "Rejecting..."
              : "Reject Result Sheet"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
