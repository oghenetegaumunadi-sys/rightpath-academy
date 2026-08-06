import type { ReactNode } from "react";

export function PageShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "mx-auto w-full max-w-7xl space-y-8",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
