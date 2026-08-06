export const brand = {
  name: "RightPath Academy",
  shortName: "RPA",
  logo: "/branding/rightpath-logo.png",
  icon: "/branding/rightpath-icon.png",
  colors: {
    primary: "#0F6B3E",
    primaryDark: "#064E2A",
    primaryDeep: "#043D22",
    accent: "#F59E0B",
    success: "#16A34A",
    danger: "#DC2626",
    background: "#F8FAFC",
    card: "#FFFFFF",
    border: "#E2E8F0",
    text: "#0F172A",
    muted: "#64748B",
  },
} as const;

export const pageContainerClass =
  "mx-auto w-full max-w-7xl space-y-8";

export const cardClass =
  "rounded-2xl border border-slate-200 bg-white shadow-sm";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-semibold text-green-800 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50";
