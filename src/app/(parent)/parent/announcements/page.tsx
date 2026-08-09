import {
  Bell,
  CalendarDays,
} from "lucide-react";
import { redirect } from "next/navigation";

import {
  Badge,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export default async function ParentAnnouncementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const {
    data: parent,
    error: parentError,
  } = await admin
    .from("parents")
    .select(`
      id,
      full_name,
      status
    `)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (
    parentError ||
    !parent ||
    parent.status !== "active"
  ) {
    redirect("/unauthorized");
  }

  const {
    data: announcements,
    error,
  } = await admin
    .from("announcements")
    .select(`
      id,
      title,
      body,
      starts_at,
      expires_at,
      audience_roles,
      created_at
    `)
    .eq("is_published", true)
    .order("starts_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Unable to load announcements:",
      {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
    );
  }

  const visibleAnnouncements =
    announcements?.filter(
      (announcement) =>
        !announcement.audience_roles?.length ||
        announcement.audience_roles.includes(
          "parent",
        ),
    ) ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          Parent Portal
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Announcements
        </h1>

        <p className="mt-2 text-slate-600">
          School notices and updates for parents and guardians.
        </p>
      </section>

      {visibleAnnouncements.length ? (
        <div className="space-y-5">
          {visibleAnnouncements.map(
            (announcement) => (
              <Card
                key={announcement.id}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <Bell className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-950">
                          {announcement.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-4" />
                            {formatDate(
                              announcement.starts_at,
                            )}
                          </span>

                          {announcement.expires_at ? (
                            <Badge variant="neutral">
                              Until{" "}
                              {formatDate(
                                announcement.expires_at,
                              )}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {announcement.body}
                    </div>
                  </div>
                </div>
              </Card>
            ),
          )}
        </div>
      ) : (
        <Card className="border-dashed py-16 text-center">
          <Bell className="mx-auto size-12 text-slate-400" />

          <h2 className="mt-5 text-lg font-semibold text-slate-900">
            No announcements
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            There are no published announcements for parents right now.
          </p>
        </Card>
      )}
    </div>
  );
}

function formatDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(
    new Date(value),
  );
}
