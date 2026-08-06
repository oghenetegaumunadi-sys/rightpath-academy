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

export const registerStudentSchema = z.object({
  surname: z
    .string()
    .trim()
    .min(2, "Surname must contain at least 2 characters.")
    .max(80, "Surname is too long."),

  firstName: z
    .string()
    .trim()
    .min(2, "First name must contain at least 2 characters.")
    .max(80, "First name is too long."),

  otherName: optionalText,

  gender: z.enum(["male", "female"], {
    message: "Select the student's gender.",
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

  admissionDate: z
    .string()
    .min(1, "Admission date is required.")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Enter a valid admission date.",
    ),

  classId: z.uuid("Select a valid class."),

  academicSessionId: z.uuid(
    "Select a valid academic session.",
  ),

  residentialAddress: optionalText,

  guardianName: z
    .string()
    .trim()
    .min(3, "Guardian name must contain at least 3 characters.")
    .max(120, "Guardian name is too long."),

  guardianPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid guardian phone number.")
    .max(30, "Phone number is too long."),

  guardianEmail: optionalEmail,

  guardianAddress: z
    .string()
    .trim()
    .min(5, "Guardian address is required.")
    .max(300, "Guardian address is too long."),

  guardianOccupation: optionalText,

  guardianRelationship: z.enum([
    "father",
    "mother",
    "guardian",
    "brother",
    "sister",
    "uncle",
    "aunt",
    "other",
  ]),
});

export type RegisterStudentInput = z.infer<
  typeof registerStudentSchema
>;

export type RegisterStudentFieldErrors = Partial<
  Record<keyof RegisterStudentInput, string[]>
>;

export type RegisterStudentState = {
  success: boolean;
  message: string | null;
  studentId: string | null;
  errors: RegisterStudentFieldErrors;
};

export const initialRegisterStudentState: RegisterStudentState = {
  success: false,
  message: null,
  studentId: null,
  errors: {},
};

export const updateStudentSchema = z.object({
  studentId: z.uuid("Invalid student record."),

  surname: z
    .string()
    .trim()
    .min(2, "Surname must contain at least 2 characters.")
    .max(80, "Surname is too long."),

  firstName: z
    .string()
    .trim()
    .min(2, "First name must contain at least 2 characters.")
    .max(80, "First name is too long."),

  otherName: optionalText,

  gender: z.enum(["male", "female"]),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required.")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Enter a valid date of birth.",
    ),

  admissionDate: z
    .string()
    .min(1, "Admission date is required.")
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      "Enter a valid admission date.",
    ),

  residentialAddress: optionalText,

  status: z.enum([
    "active",
    "inactive",
    "suspended",
    "graduated",
    "withdrawn",
    "archived",
  ]),

  classId: z.uuid("Select a valid class."),

  enrollmentId: z.uuid("Invalid enrollment record."),

  guardianId: z.uuid("Invalid guardian record."),

  guardianName: z
    .string()
    .trim()
    .min(3, "Guardian name must contain at least 3 characters.")
    .max(120, "Guardian name is too long."),

  guardianPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid guardian phone number.")
    .max(30, "Phone number is too long."),

  guardianEmail: optionalEmail,

  guardianAddress: z
    .string()
    .trim()
    .min(5, "Guardian address is required.")
    .max(300, "Guardian address is too long."),

  guardianOccupation: optionalText,

  guardianRelationship: z.enum([
    "father",
    "mother",
    "guardian",
    "brother",
    "sister",
    "uncle",
    "aunt",
    "other",
  ]),
});

export type UpdateStudentInput = z.infer<
  typeof updateStudentSchema
>;

export type UpdateStudentFieldErrors = Partial<
  Record<keyof UpdateStudentInput, string[]>
>;

export type UpdateStudentState = {
  success: boolean;
  message: string | null;
  errors: UpdateStudentFieldErrors;
};

export const initialUpdateStudentState: UpdateStudentState = {
  success: false,
  message: null,
  errors: {},
};
