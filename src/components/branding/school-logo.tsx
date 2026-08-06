import Image from "next/image";
import Link from "next/link";

type SchoolLogoProps = {
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  href?: string | null;
  inverse?: boolean;
  priority?: boolean;
  className?: string;
};

const sizes = {
  sm: {
    image: 36,
    wrapper: "size-9",
    title: "text-sm",
    subtitle: "text-[10px]",
  },
  md: {
    image: 48,
    wrapper: "size-12",
    title: "text-base",
    subtitle: "text-xs",
  },
  lg: {
    image: 64,
    wrapper: "size-16",
    title: "text-xl",
    subtitle: "text-sm",
  },
  xl: {
    image: 112,
    wrapper: "size-28",
    title: "text-2xl",
    subtitle: "text-base",
  },
};

export function SchoolLogo({
  size = "md",
  showName = true,
  href = "/",
  inverse = false,
  priority = false,
  className = "",
}: SchoolLogoProps) {
  const config = sizes[size];

  const content = (
    <div
      className={[
        "inline-flex items-center gap-3",
        className,
      ].join(" ")}
    >
      <div
        className={[
          config.wrapper,
          "relative shrink-0 overflow-hidden rounded-full bg-white",
        ].join(" ")}
      >
        <Image
          src="/branding/rightpath-logo.png"
          alt="RightPath Academy"
          width={config.image}
          height={config.image}
          priority={priority}
          className="h-full w-full object-contain"
        />
      </div>

      {showName ? (
        <div className="min-w-0 leading-tight">
          <p
            className={[
              config.title,
              "font-bold tracking-tight",
              inverse ? "text-white" : "text-slate-950",
            ].join(" ")}
          >
            RIGHTPATH
          </p>

          <p
            className={[
              config.subtitle,
              "font-semibold tracking-[0.16em]",
              inverse
                ? "text-green-100"
                : "text-green-700",
            ].join(" ")}
          >
            ACADEMY
          </p>
        </div>
      ) : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      aria-label="RightPath Academy home"
      className="inline-flex"
    >
      {content}
    </Link>
  );
}
