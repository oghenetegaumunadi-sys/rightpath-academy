"use server";

import { revalidatePath } from "next/cache";

import { ensureUserRole } from "@/lib/auth/ensure-user-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  initialRegisterTeacherState,
  registerTeacherSchema,
  type RegisterTeacherState,
} from "@/lib/validations";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function getSurname(fullName: string) {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts[parts.length - 1]?.toLowerCase() ?? "";
}

function makeAuthEmail(employeeId: string) {
  const safeId = employeeId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeId}@staff.rightpath.local`;
}

export async function registerTeacherAction(
  _previousState: RegisterTeacherState,
  formData: FormData,
): Promise<RegisterTeacherState> {
  const genderValue = getString(formData, "gender");

  const parsed = registerTeacherSchema.safeParse({
    fullName: getString(formData, "fullName"),
    phone: getString(formData, "phone"),
    email: getString(formData, "email"),
    gender: genderValue,
    dateOfBirth: getString(formData, "dateOfBirth"),
    employmentDate: getString(
      formData,
      "employmentDate",
    ),
    qualification: getString(
      formData,
      "qualification",
    ),
    specialization: getString(
      formData,
      "specialization",
    ),
    address: getString(formData, "address"),
  });

  if (!parsed.success) {
    return {
      ...initialRegisterTeacherState,
      message:
        "Please correct the highlighted fields.",
      errors:
        parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ...initialRegisterTeacherState,
      message:
        "Your session has expired. Please sign in again.",
    };
  }

  const role = await ensureUserRole(
    user.id,
    user.email,
  );

  if (
    !role ||
    ![
      "principal",
      "vice_principal",
      "admin",
    ].includes(role)
  ) {
    return {
      ...initialRegisterTeacherState,
      message:
        "Your account does not have permission to register teachers.",
    };
  }

  const {
    data: teacherId,
    error: teacherError,
  } = await supabase.rpc(
    "register_teacher",
    {
      p_full_name: parsed.data.fullName,
      p_phone: parsed.data.phone,
      p_email: parsed.data.email ?? "",
      p_gender: parsed.data.gender,
      p_date_of_birth:
        parsed.data.dateOfBirth,
      p_employment_date:
        parsed.data.employmentDate,
      p_qualification:
        parsed.data.qualification,
      p_specialization:
        parsed.data.specialization ?? "",
      p_address:
        parsed.data.address ?? "",
    },
  );

  if (teacherError || !teacherId) {
    console.error(
      "Teacher registration failed:",
      {
        message: teacherError?.message,
        code: teacherError?.code,
        details: teacherError?.details,
        hint: teacherError?.hint,
      },
    );

    return {
      ...initialRegisterTeacherState,
      message:
        teacherError?.message ||
        "Teacher registration failed. Please try again.",
    };
  }

  const admin = createAdminClient();

  const {
    data: teacher,
    error: fetchTeacherError,
  } = await admin
    .from("teachers")
    .select(`
      id,
      employee_id,
      full_name,
      phone,
      email
    `)
    .eq("id", teacherId)
    .single();

  if (fetchTeacherError || !teacher) {
    return {
      ...initialRegisterTeacherState,
      message:
        fetchTeacherError?.message ??
        "Teacher was created, but login credentials could not be prepared.",
      teacherId: String(teacherId),
    };
  }

  const temporaryPassword =
    getSurname(teacher.full_name);

  if (!temporaryPassword) {
    return {
      ...initialRegisterTeacherState,
      message:
        "Teacher was created, but no surname could be determined for the temporary password.",
      teacherId: teacher.id,
    };
  }

  const authEmail = makeAuthEmail(
    teacher.employee_id,
  );

  const {
    data: authUserData,
    error: authCreateError,
  } =
    await admin.auth.admin.createUser({
      email: authEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: teacher.full_name,
        employee_id: teacher.employee_id,
        account_type: "teacher",
      },
    });

  if (
    authCreateError ||
    !authUserData.user
  ) {
    console.error(
      "Teacher auth creation failed:",
      authCreateError,
    );

    return {
      ...initialRegisterTeacherState,
      message:
        authCreateError?.message ??
        "Teacher was created, but the login account could not be created.",
      teacherId: teacher.id,
    };
  }

  const profileId = authUserData.user.id;

  const {
    error: profileError,
  } = await admin
    .from("profiles")
    .upsert({
      id: profileId,
      email: authEmail,
      full_name: teacher.full_name,
      phone: teacher.phone,
      status: "active",
      updated_at:
        new Date().toISOString(),
    });

  if (profileError) {
    return {
      ...initialRegisterTeacherState,
      message:
        `Teacher was created, but profile setup failed: ${profileError.message}`,
      teacherId: teacher.id,
    };
  }

  const {
    data: teacherRole,
    error: roleError,
  } = await admin
    .from("roles")
    .select("id")
    .eq("name", "teacher")
    .maybeSingle();

  if (roleError || !teacherRole) {
    return {
      ...initialRegisterTeacherState,
      message:
        roleError?.message ??
        "Teacher role is missing from the roles table.",
      teacherId: teacher.id,
    };
  }

  const {
    data: existingProfileRole,
    error: existingRoleError,
  } = await admin
    .from("profile_roles")
    .select("profile_id, role_id")
    .eq("profile_id", profileId)
    .eq("role_id", teacherRole.id)
    .maybeSingle();

  if (existingRoleError) {
    return {
      ...initialRegisterTeacherState,
      message:
        `Teacher was created, but role verification failed: ${existingRoleError.message}`,
      teacherId: teacher.id,
    };
  }

  let profileRoleError = null;

  if (!existingProfileRole) {
    const result = await admin
      .from("profile_roles")
      .insert({
        profile_id: profileId,
        role_id: teacherRole.id,
        assigned_by: user.id,
      });

    profileRoleError = result.error;
  }

  if (profileRoleError) {
    return {
      ...initialRegisterTeacherState,
      message:
        `Teacher was created, but role assignment failed: ${profileRoleError.message}`,
      teacherId: teacher.id,
    };
  }

  const {
    error: teacherLinkError,
  } = await admin
    .from("teachers")
    .update({
      profile_id: profileId,
      must_change_password: true,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", teacher.id);

  if (teacherLinkError) {
    return {
      ...initialRegisterTeacherState,
      message:
        `Teacher was created, but account linking failed: ${teacherLinkError.message}`,
      teacherId: teacher.id,
    };
  }

  revalidatePath("/teachers");
  revalidatePath(
    "/dashboard/principal",
  );

  return {
    success: true,
    message:
      `Teacher registered successfully. Login ID: ${teacher.employee_id}. Temporary password: ${temporaryPassword}`,
    teacherId: teacher.id,
    errors: {},
  };
}
