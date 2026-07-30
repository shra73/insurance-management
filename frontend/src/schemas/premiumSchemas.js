import { z } from "zod";

const VALID_STATUSES = ["PENDING", "PAID", "FAILED", "PARTIAL"];

export const recordPaymentSchema = z
  .object({
    amount: z
      .string()
      .min(1, "Amount is required")
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: "Amount must be a positive number"
      }),
    payment_status: z.enum(VALID_STATUSES, {
      errorMap: () => ({ message: "Select a valid status" })
    }),
    payment_date: z.string().optional().or(z.literal("")),
    payment_reference: z.string().optional().or(z.literal(""))
  })
  .refine((data) => data.payment_status !== "PAID" || data.payment_date, {
    message: "Payment date is required when status is PAID",
    path: ["payment_date"]
  })
  .refine(
    (data) =>
      !(data.payment_status === "PENDING" || data.payment_status === "FAILED") ||
      !data.payment_date,
    {
      message: "Payment date should not be set for PENDING or FAILED payments",
      path: ["payment_date"]
    }
  );