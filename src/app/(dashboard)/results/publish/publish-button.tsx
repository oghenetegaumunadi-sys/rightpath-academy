"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Send,
} from "lucide-react";
import {
  useActionState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui";

import {
  publishClassResultsAction,
  type PublishClassResultsState,
} from "./actions";

const initialState: PublishClassResultsState = {
  success: false,
  message: null,
  publishedCount: 0,
};

export function PublishClassResultsButton({
  classId,
  termId,
  className,
  disabled,
  alreadyPublished,
}: {
  classId: string;
  termId: string;
  className: string;
  disabled: boolean;
  alreadyPublished: boolean;
}) {
  const router = useRouter();

  const [state, formAction, pending] =
    useActionState(
      publishClassResultsAction,
      initialState,
    );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      router.refresh();
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction}>
      <input
        type="hidden"
        name="classId"
        value={classId}
      />

      <input
        type="hidden"
        name="termId"
        value={termId}
      />

      <Button
        type="submit"
        disabled={
          disabled ||
          pending ||
          alreadyPublished
        }
        className="w-full"
        onClick={(event) => {
          if (
            alreadyPublished ||
            !window.confirm(
              `Publish ${className} results? Published results will become available for report cards.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        {pending ? (
          <LoaderCircle className="size-5 animate-spin" />
        ) : alreadyPublished ? (
          <CheckCircle2 className="size-5" />
        ) : (
          <Send className="size-5" />
        )}

        {pending
          ? "Publishing..."
          : alreadyPublished
            ? "Results Published"
            : "Publish Class Results"}
      </Button>
    </form>
  );
}
