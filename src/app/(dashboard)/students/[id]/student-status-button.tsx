"use client";

import {
  Archive,
  LoaderCircle,
  RotateCcw,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui";

import { updateStudentStatusAction } from "./status-actions";

type StudentStatusButtonProps = {
  studentId: string;
  currentStatus: string;
};

export function StudentStatusButton({
  studentId,
  currentStatus,
}: StudentStatusButtonProps) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  const nextStatus =
    status === "archived" ? "active" : "archived";

  const label =
    nextStatus === "archived"
      ? "Archive Student"
      : "Restore Student";

  function handleClick() {
    const confirmed = window.confirm(
      nextStatus === "archived"
        ? "Archive this student? Their record will remain available."
        : "Restore this student to active status?",
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await updateStudentStatusAction(
        studentId,
        nextStatus,
      );

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      setStatus(nextStatus);
      toast.success(result.message);
    });
  }

  return (
    <Button
      type="button"
      variant={
        nextStatus === "archived"
          ? "destructive"
          : "outline"
      }
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : nextStatus === "archived" ? (
        <Archive className="size-4" />
      ) : (
        <RotateCcw className="size-4" />
      )}

      {pending ? "Updating..." : label}
    </Button>
  );
}
