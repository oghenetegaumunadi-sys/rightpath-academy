"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AnnouncementState = {
  success: boolean;
  message: string | null;
};

function lagosLocalToIso(
  value: string,
) {
  const clean = value.trim();

  if (!clean) {
    return null;
  }

  // datetime-local normally arrives as YYYY-MM-DDTHH:mm.
  // Nigeria uses WAT (UTC+1) year-round.
  const withSeconds =
    clean.length === 16
      ? `${clean}:00`
      : clean;

  const date = new Date(
    `${withSeconds}+01:00`,
  );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toISOString();
}

async function getAuthorizedUser() {
  const supabase =
    await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (
    error ||
    !user?.email
  ) {
    return {
      user: null,
      role: null,
      error:
        "Your session has expired. Please sign in again.",
    };
  }

  const role =
    await ensureUserRole(
      user.id,
      user.email,
    );

  if (
    !role ||
    ![
      "director",
      "school_admin",

      // Legacy roles retained during migration
      "principal",
      "vice_principal",
      "admin",
    ].includes(role)
  ) {
    return {
      user: null,
      role,
      error:
        "Your account cannot manage announcements.",
    };
  }

  return {
    user,
    role,
    error: null,
  };
}

export async function createAnnouncementAction(
  _previousState: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  try {
    const title = String(
      formData.get("title") ?? "",
    ).trim();

    const body = String(
      formData.get("body") ?? "",
    ).trim();

    const startsAtRaw = String(
      formData.get("startsAt") ?? "",
    ).trim();

    const expiresAtRaw = String(
      formData.get("expiresAt") ?? "",
    ).trim();

    const publishNow =
      String(
        formData.get("publishNow") ??
          "",
      ) === "on";

    if (
      title.length < 3
    ) {
      return {
        success: false,
        message:
          "Enter an announcement title.",
      };
    }

    if (
      body.length < 5
    ) {
      return {
        success: false,
        message:
          "Enter the announcement message.",
      };
    }

    const startsAt =
      startsAtRaw
        ? lagosLocalToIso(
            startsAtRaw,
          )
        : new Date().toISOString();

    if (!startsAt) {
      return {
        success: false,
        message:
          "Enter a valid start date and time.",
      };
    }

    const expiresAt =
      expiresAtRaw
        ? lagosLocalToIso(
            expiresAtRaw,
          )
        : null;

    if (
      expiresAtRaw &&
      !expiresAt
    ) {
      return {
        success: false,
        message:
          "Enter a valid expiry date and time.",
      };
    }

    if (
      expiresAt &&
      new Date(expiresAt) <=
        new Date(startsAt)
    ) {
      return {
        success: false,
        message:
          "The expiry time must be later than the start time.",
      };
    }

    const auth =
      await getAuthorizedUser();

    if (
      !auth.user ||
      auth.error
    ) {
      return {
        success: false,
        message:
          auth.error ??
          "Unable to verify your account.",
      };
    }

    const admin =
      createAdminClient();

    const {
      error: insertError,
    } = await admin
      .from("announcements")
      .insert({
        title,
        body,
        audience_roles: [
          "parent",
        ],
        starts_at:
          startsAt,
        expires_at:
          expiresAt,
        is_published:
          publishNow,
        created_by:
          auth.user.id,
        updated_at:
          new Date().toISOString(),
      });

    if (insertError) {
      return {
        success: false,
        message:
          insertError.message,
      };
    }

    revalidatePath(
      "/announcements",
    );
    revalidatePath(
      "/parent",
    );
    revalidatePath(
      "/parent/announcements",
    );
    revalidatePath(
      "/dashboard/admin",
    );
    revalidatePath(
      "/dashboard/director",
    );

    return {
      success: true,
      message:
        publishNow
          ? "Announcement published to parents."
          : "Announcement saved as a draft.",
    };
  } catch (error) {
    console.error(
      "Unexpected announcement error:",
      error,
    );

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected announcement error occurred.",
    };
  }
}

export async function toggleAnnouncementAction(
  formData: FormData,
) {
  const announcementId =
    String(
      formData.get(
        "announcementId",
      ) ?? "",
    ).trim();

  const publish =
    String(
      formData.get("publish") ??
        "",
    ) === "true";

  if (!announcementId) {
    return;
  }

  const auth =
    await getAuthorizedUser();

  if (
    !auth.user ||
    auth.error
  ) {
    return;
  }

  const admin =
    createAdminClient();

  const {
    error,
  } = await admin
    .from("announcements")
    .update({
      is_published:
        publish,
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      announcementId,
    );

  if (error) {
    console.error(
      "Unable to update announcement:",
      error,
    );
  }

  revalidatePath(
    "/announcements",
  );
  revalidatePath(
    "/parent",
  );
  revalidatePath(
    "/parent/announcements",
  );
  revalidatePath(
    "/dashboard/admin",
  );
  revalidatePath(
    "/dashboard/director",
  );
}

export async function deleteAnnouncementAction(
  formData: FormData,
) {
  const announcementId =
    String(
      formData.get(
        "announcementId",
      ) ?? "",
    ).trim();

  if (!announcementId) {
    return;
  }

  const auth =
    await getAuthorizedUser();

  if (
    !auth.user ||
    auth.error
  ) {
    return;
  }

  const admin =
    createAdminClient();

  const {
    error,
  } = await admin
    .from("announcements")
    .delete()
    .eq(
      "id",
      announcementId,
    );

  if (error) {
    console.error(
      "Unable to delete announcement:",
      error,
    );
  }

  revalidatePath(
    "/announcements",
  );
  revalidatePath(
    "/parent",
  );
  revalidatePath(
    "/parent/announcements",
  );
}
