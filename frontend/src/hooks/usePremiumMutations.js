import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createPremiumPayment } from "../services/premiumService";

export function useCreatePremiumPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPremiumPayment,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["premiums"] });
      queryClient.invalidateQueries({ queryKey: ["premiumHistory", variables.policy_id] });
      toast.success("Payment recorded successfully");
      if (data.premium?.payment_status === "PAID") {
        toast.info("A payment receipt email has been sent to the customer.");
      }
    },
    onError: (error) => {
      // The backend returns 409 specifically for overpayment attempts --
      // surface that message clearly rather than a generic failure toast.
      const message = error.response?.data?.error || "Failed to record payment";
      toast.error(message);
    }
  });
}