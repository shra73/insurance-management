import { useQuery } from "@tanstack/react-query";
import { fetchPremiumHistory } from "../services/premiumService";
import { fetchPolicyById } from "../services/policyService";
import { fetchCustomerById } from "../services/customerService";

// Derives customer name, premium amount, and outstanding balance for a
// given policy_id. All three queries are cached by TanStack Query keyed
// on policy_id/customer_id, so multiple table rows sharing the same
// policy only trigger one network request each, not one per row.
export function usePremiumRowContext(policyId) {
  const historyQuery = useQuery({
    queryKey: ["premiumHistory", policyId],
    queryFn: () => fetchPremiumHistory(policyId),
    enabled: !!policyId
  });

  const policyQuery = useQuery({
    queryKey: ["policy", policyId],
    queryFn: () => fetchPolicyById(policyId),
    enabled: !!policyId
  });

  const customerQuery = useQuery({
    queryKey: ["customer", policyQuery.data?.customer_id],
    queryFn: () => fetchCustomerById(policyQuery.data.customer_id),
    enabled: !!policyQuery.data?.customer_id
  });

  return {
    isLoading: historyQuery.isLoading || policyQuery.isLoading || customerQuery.isLoading,
    customerName: customerQuery.data?.name,
    premiumAmount: historyQuery.data?.policy?.premium_amount,
    outstandingAmount: historyQuery.data?.summary?.outstanding_amount
  };
}