import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

const optionalEmail = z
  .string()
  .trim()
  .transform((value) => value || null)
  .pipe(z.email().nullable());

export const registerTeacherSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Full name must contain at least 3 characters.")
    .max(120, "Full name is too long."),

  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(30, "Phone number is too long."),

  email: optionalEmail,

  gender: z.enum(["male", "female"], {
    message: "Select the teacher's gender.",
  }),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required.")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Enter a valid date of birth.",
    )
    .refine(
      (value) => new Date(value) < new Date(),
      "Date of birth must be in the past.",
    ),

  employmentDate: z
    .string()
    .min(1, "Employment date is required.")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Enter a valid employment date.",
    ),

  qualification: z
    .string()
    .trim()
    .min(2, "Qualification is required.")
    .max(150, "Qualification is too long."),

  specialization: optionalText,

  address: optionalText,
});

export type RegisterTeacherInput = z.infer<
  typeof registerTeacherSchema
>;

export type RegisterTeacherFieldErrors = Partial<
  Record<keyof RegisterTeacherInput, string[]>
>;

export type RegisterTeacherState = {
  success: boolean;
  message: string | null;
  teacherId: string | null;
  errors: RegisterTeacherFieldErrors;
};

export const initialRegisterTeacherState: RegisterTeacherState = {
  success: false,
  message: null,
  teacherId: null,
  errors: {},
};


export const updateTeacherSchema = z.object({
  teacherId: z.uuid("Invalid teacher record."),

  fullName: z
    .string()
    .trim()
    .min(3, "Full name must contain at least 3 characters.")
    .max(120, "Full name is too long."),

  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number.")
    .max(30, "Phone number is too long."),

  email: optionalEmail,

  gender: z.enum(["male", "female"], {
    message: "Select the teacher's gender.",
  }),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required.")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Enter a valid date of birth.",
    ),

  employmentDate: z
    .string()
    .min(1, "Employment date is required.")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Enter a valid employment date.",
    ),

  qualification: z
    .string()
    .trim()
    .min(2, "Qualification is required.")
    .max(150, "Qualification is too long."),

  specialization: optionalText,

  address: optionalText,

  status: z.enum([
    "active",
    "inactive",
    "suspended",
    "graduated",
    "withdrawn",
    "archived",
  ]),
});

export type UpdateTeacherInput = z.infer<
  typeof updateTeacherSchema
>;

export type UpdateTeacherFieldErrors = Partial<
  Record<keyof UpdateTeacherInput, string[]>
>;

export type UpdateTeacherState = {
  success: boolean;
  message: string | null;
  errors: UpdateTeacherFieldErrors;
};

export const initialUpdateTeacherState: UpdateTeacherState = {
  success: false,
  message: null,
  errors: {},
};
