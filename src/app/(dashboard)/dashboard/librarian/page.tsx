export default function RoleDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <section className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-widest text-emerald-600">
          Rightpath Academy
        </p>

        <h1 className="mt-3 text-3xl font-bold text-slate-950">
          Librarian Dashboard
        </h1>

        <p className="mt-3 text-slate-600">
          This dashboard is connected and ready for development.
        </p>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="mt-6 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
