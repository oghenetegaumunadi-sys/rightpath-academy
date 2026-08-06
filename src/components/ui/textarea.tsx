import {
  forwardRef,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type TextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    error?: boolean;
  };

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ className, error = false, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400",
        "focus:ring-4",
        error
          ? "border-red-300 focus:border-red-500 focus:ring-red-100"
          : "border-slate-200 focus:border-green-500 focus:ring-green-100",
        className,
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
