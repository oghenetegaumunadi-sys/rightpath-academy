import { z } from "zod";

export const createSubjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Subject name must contain at least 2 characters.")
    .max(100, "Subject name is too long."),

  code: z
    .string()
    .trim()
    .min(2, "Subject code must contain at least 2 characters.")
    .max(20, "Subject code is too long.")
    .transform((value) => value.toUpperCase()),

  description: z
    .string()
    .trim()
    .transform((value) => value || null),

  isCore: z.boolean(),
});

export type CreateSubjectInput = z.infer<
  typeof createSubjectSchema
>;

export type CreateSubjectFieldErrors = Partial<
  Record<keyof CreateSubjectInput, string[]>
>;

export type CreateSubjectState = {
  success: boolean;
  message: string | null;
  subjectId: string | null;
  errors: CreateSubjectFieldErrors;
};

export const initialCreateSubjectState: CreateSubjectState = {
  success: false,
  message: null,
  subjectId: null,
  errors: {},
};
