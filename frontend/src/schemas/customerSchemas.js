import { z } from "zod";

// Mirrors the backend's actual validation rules (Create/Update Customer API)
export const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .regex(/^\+?\d{7,15}$/, "Enter a valid phone number"),
  address: z.string().min(1, "Address is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address")
});