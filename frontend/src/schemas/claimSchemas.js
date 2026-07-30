import { z } from "zod";

export const claimSchema = z.object({
  policy_id: z.number({ invalid_type_error: "Please select a policy" }),
  claim_number: z.string().min(1, "Claim number is required"),
  claim_amount: z
    .string()
    .min(1, "Claim amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Claim amount must be a positive number"
    }),
  claim_date: z
    .string()
    .min(1, "Incident date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  description: z.string().optional().or(z.literal(""))
});

export const editClaimSchema = z.object({
  claim_amount: z
    .string()
    .min(1, "Claim amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Claim amount must be a positive number"
    }),
  claim_date: z
    .string()
    .min(1, "Incident date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  description: z.string().optional().or(z.literal(""))
});