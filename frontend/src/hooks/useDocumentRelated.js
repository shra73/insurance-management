import { useQuery } from "@tanstack/react-query";
import { fetchPolicyById } from "../services/policyService";
import { fetchCustomerById } from "../services/customerService";

// Derives "Related Policy" and "Related Customer" for a document, since
// Document only stores policy_id directly. Cached per policy/customer ID
// so multiple documents sharing a policy only fetch once.
export function useDocumentRelated(policyId) {
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
    isLoading: policyQuery.isLoading || customerQuery.isLoading,
    policyNumber: policyQuery.data?.policy_number,
    customerName: customerQuery.data?.name
  };
}