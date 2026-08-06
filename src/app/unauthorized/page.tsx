import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6">
      <section className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-600">
          Account setup required
        </p>

        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          No role has been assigned
        </h1>

        <p className="mt-4 leading-7 text-slate-600">
          Your account exists, but an administrator has not assigned
          a dashboard role yet.
        </p>

        <Link
          href="/login"
          className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
