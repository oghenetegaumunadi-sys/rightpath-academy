import type { Metadata } from "next";
import {
  CalendarDays,
  Megaphone,
  Trash2,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
} from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/admin";

import { AnnouncementForm } from "./announcement-form";
import {
  deleteAnnouncementAction,
  toggleAnnouncementAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Parent Announcements",
};

export default async function AnnouncementsPage() {
  const admin =
    createAdminClient();

  const {
    data: announcements,
    error,
  } = await admin
    .from("announcements")
    .select(`
      id,
      title,
      body,
      audience_roles,
      starts_at,
      expires_at,
      is_published,
      created_at,
      profiles!announcements_created_by_fkey (
        full_name
      )
    `)
    .contains(
      "audience_roles",
      ["parent"],
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (error) {
    console.error(
      "Unable to load announcements:",
      error,
    );
  }

  const now =
    new Date();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-green-700">
          School Administration
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Parent Announcements
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600">
          Create and publish school notices directly to parents and guardians.
        </p>
      </section>

      <Card>
        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
            <Megaphone className="size-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              New Announcement
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              This announcement will be targeted to Parent Portal users.
            </p>
          </div>
        </div>

        <AnnouncementForm />
      </Card>

      <section>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Announcement History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage drafts and previously published parent notices.
          </p>
        </div>

        <div className="mt-5 space-y-4">
          {announcements?.length ? (
            announcements.map(
              (announcement) => {
                const startsAt =
                  new Date(
                    announcement.starts_at,
                  );

                const expiresAt =
                  announcement.expires_at
                    ? new Date(
                        announcement.expires_at,
                      )
                    : null;

                const active =
                  announcement.is_published &&
                  startsAt <= now &&
                  (!expiresAt ||
                    expiresAt > now);

                const scheduled =
                  announcement.is_published &&
                  startsAt > now;

                const expired =
                  Boolean(
                    expiresAt &&
                      expiresAt <= now,
                  );

                const creatorRelation =
                  announcement.profiles;

                const creator =
                  Array.isArray(
                    creatorRelation,
                  )
                    ? creatorRelation[0]
                    : creatorRelation;

                return (
                  <Card
                    key={
                      announcement.id
                    }
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-slate-950">
                            {
                              announcement.title
                            }
                          </h3>

                          <Badge
                            variant={
                              active
                                ? "success"
                                : scheduled
                                  ? "info"
                                  : expired
                                    ? "neutral"
                                    : announcement.is_published
                                      ? "info"
                                      : "warning"
                            }
                          >
                            {active
                              ? "Live"
                              : scheduled
                                ? "Scheduled"
                                : expired
                                  ? "Expired"
                                  : announcement.is_published
                                    ? "Published"
                                    : "Draft"}
                          </Badge>
                        </div>

                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                          {
                            announcement.body
                          }
                        </p>

                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-4" />

                            Starts{" "}
                            {formatDateTime(
                              announcement.starts_at,
                            )}
                          </span>

                          {announcement.expires_at ? (
                            <span>
                              Expires{" "}
                              {formatDateTime(
                                announcement.expires_at,
                              )}
                            </span>
                          ) : null}

                          {creator?.full_name ? (
                            <span>
                              Created by{" "}
                              {
                                creator.full_name
                              }
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <form
                          action={
                            toggleAnnouncementAction
                          }
                        >
                          <input
                            type="hidden"
                            name="announcementId"
                            value={
                              announcement.id
                            }
                          />

                          <input
                            type="hidden"
                            name="publish"
                            value={
                              announcement.is_published
                                ? "false"
                                : "true"
                            }
                          />

                          <Button
                            type="submit"
                            variant={
                              announcement.is_published
                                ? "outline"
                                : "primary"
                            }
                            size="sm"
                          >
                            {announcement.is_published
                              ? "Unpublish"
                              : "Publish"}
                          </Button>
                        </form>

                        <form
                          action={
                            deleteAnnouncementAction
                          }
                        >
                          <input
                            type="hidden"
                            name="announcementId"
                            value={
                              announcement.id
                            }
                          />

                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="text-red-700"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </Button>
                        </form>
                      </div>
                    </div>
                  </Card>
                );
              },
            )
          ) : (
            <Card className="border-dashed py-14 text-center">
              <Megaphone className="mx-auto size-11 text-slate-400" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No parent announcements yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create the first notice using the form above.
              </p>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone:
        "Africa/Lagos",
    },
  ).format(
    new Date(value),
  );
}
