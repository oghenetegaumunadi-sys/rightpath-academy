"use client";

import {
  BookOpen,
  CheckCircle2,
  LoaderCircle,
  Save,
} from "lucide-react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  Textarea,
} from "@/components/ui";
import { initialCreateSubjectState } from "@/lib/validations";

import { createSubjectAction } from "./actions";

export function SubjectForm() {
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    createSubjectAction,
    initialCreateSubjectState,
  );

  useEffect(() => {
    if (state.success && state.message) {
      toast.success(state.message);
      router.push("/subjects");
      router.refresh();
    } else if (!state.success && state.message) {
      toast.error(state.message);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <BookOpen className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              Subject Information
            </h2>

            <p className="text-sm text-slate-500">
              Add a subject that can later be assigned to classes
              and teachers.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <Label htmlFor="name">
              Subject name
            </Label>

            <Input
              id="name"
              name="name"
              placeholder="Mathematics"
              required
              error={Boolean(state.errors.name?.length)}
            />

            <FieldError messages={state.errors.name} />
          </div>

          <div>
            <Label htmlFor="code">
              Subject code
            </Label>

            <Input
              id="code"
              name="code"
              placeholder="MTH"
              required
              className="uppercase"
              error={Boolean(state.errors.code?.length)}
            />

            <FieldError messages={state.errors.code} />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">
              Description
            </Label>

            <Textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Briefly describe the subject."
              error={Boolean(
                state.errors.description?.length,
              )}
            />

            <FieldError
              messages={state.errors.description}
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <input
                type="checkbox"
                name="isCore"
                className="mt-1 size-4 accent-green-600"
              />

              <span>
                <span className="block font-semibold text-slate-900">
                  Core subject
                </span>

                <span className="mt-1 block text-sm text-slate-600">
                  Core subjects are compulsory for most students.
                </span>
              </span>
            </label>
          </div>
        </div>
      </Card>

      {state.success ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="size-5" />
          <p className="font-semibold">
            Subject created successfully.
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="min-w-44"
        >
          {pending ? (
            <LoaderCircle className="size-5 animate-spin" />
          ) : (
            <Save className="size-5" />
          )}

          {pending ? "Saving..." : "Create Subject"}
        </Button>
      </div>
    </form>
  );
}
