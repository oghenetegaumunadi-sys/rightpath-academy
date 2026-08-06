import type { LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({
  className,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        "mb-2 block text-sm font-semibold text-slate-700",
        className,
      )}
      {...props}
    />
  );
}
