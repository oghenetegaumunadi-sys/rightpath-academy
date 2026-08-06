"use client";

import Image from "next/image";
import {
  Camera,
  GraduationCap,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { Button, Input, Label } from "@/components/ui";

import {
  uploadStudentPhotoAction,
  type UploadStudentPhotoState,
} from "./actions";

const initialUploadStudentPhotoState: UploadStudentPhotoState = {
  success: false,
  message: null,
  url: null,
};

type StudentPhotoUploaderProps = {
  studentId: string;
  studentName: string;
  currentPhotoUrl: string | null;
};

export function StudentPhotoUploader({
  studentId,
  studentName,
  currentPhotoUrl,
}: StudentPhotoUploaderProps) {
  const [state, formAction, pending] = useActionState(
    uploadStudentPhotoAction,
    initialUploadStudentPhotoState,
  );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state]);

  const photoUrl = state.url ?? currentPhotoUrl;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Camera className="size-5" />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Passport Photograph
          </h2>

          <p className="text-sm text-slate-500">
            Upload a clear JPG, PNG or WebP image.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={`${studentName} passport`}
              fill
              sizes="128px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <GraduationCap className="size-12 text-green-700" />
          )}
        </div>

        <form action={formAction} className="flex-1 space-y-4">
          <input
            type="hidden"
            name="studentId"
            value={studentId}
          />

          <div>
            <Label htmlFor="photo">
              Select photograph
            </Label>

            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
            />

            <p className="mt-2 text-xs text-slate-500">
              Maximum file size: 5 MB.
            </p>
          </div>

          <Button
            type="submit"
            disabled={pending}
          >
            {pending ? (
              <LoaderCircle className="size-5 animate-spin" />
            ) : (
              <Upload className="size-5" />
            )}

            {pending ? "Uploading..." : "Upload Photo"}
          </Button>
        </form>
      </div>
    </section>
  );
}
