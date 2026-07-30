import { z } from "zod";

const VALID_STATUSES = ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"];

// Mirrors the actual backend Policy model / Create Policy API validation.
export const policySchema = z
  .object({
    customer_id: z.number({ invalid_type_error: "Please select a customer" }),
    policy_number: z.string().min(1, "Policy number is required"),
    type: z.string().min(1, "Policy type is required"),
    start_date: z
      .string()
      .min(1, "Start date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    end_date: z
      .string()
      .min(1, "End date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    premium_amount: z
      .string()
      .min(1, "Premium amount is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Premium amount must be a positive number"
      }),
    status: z.enum(VALID_STATUSES, { errorMap: () => ({ message: "Select a valid status" }) })
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"]
  });