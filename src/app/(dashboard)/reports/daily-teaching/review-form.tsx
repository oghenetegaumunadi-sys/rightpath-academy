"use client";

import {
  CheckCircle2,
  LoaderCircle,
  MessageSquareWarning,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { toast } from "sonner";

import {
  Button,
  Textarea,
} from "@/components/ui";

import {
  reviewTeachingReportAction,
  type ReviewTeachingReportState,
} from "./review-actions";

const initialState: ReviewTeachingReportState = {
  success: false,
  message: null,
};

export function ReviewTeachingReportForm({
  reportId,
  existingComment,
}: {
  reportId: string;
  existingComment: string | null;
}) {
  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    reviewTeachingReportAction,
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
      className="space-y-3"
    >
      <input
        type="hidden"
        name="reportId"
        value={reportId}
      />

      <Textarea
        name="reviewComment"
        rows={3}
        defaultValue={
          existingComment ?? ""
        }
        placeholder="Optional review comment. Required when returning for attention."
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="reviewStatus"
          value="reviewed"
          disabled={pending}
          size="sm"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}

          Mark Reviewed
        </Button>

        <Button
          type="submit"
          name="reviewStatus"
          value="needs_attention"
          disabled={pending}
          size="sm"
          variant="outline"
        >
          <MessageSquareWarning className="size-4" />
          Needs Attention
        </Button>
      </div>
    </form>
  );
}
