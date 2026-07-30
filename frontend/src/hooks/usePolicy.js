import { useQuery } from "@tanstack/react-query";
import { fetchPolicyById } from "../services/policyService";
import { fetchPremiumHistory } from "../services/premiumService";
import { fetchClaimsByPolicy } from "../services/claimService";
import { fetchDocumentsByPolicy } from "../services/documentService";

export function usePolicy(id) {
  return useQuery({
    queryKey: ["policy", id],
    queryFn: () => fetchPolicyById(id),
    enabled: !!id
  });
}

export function usePolicyPremiumHistory(id) {
  return useQuery({
    queryKey: ["policy", id, "premiums"],
    queryFn: () => fetchPremiumHistory(id),
    enabled: !!id
  });
}

export function usePolicyClaims(id) {
  return useQuery({
    queryKey: ["policy", id, "claims"],
    queryFn: () => fetchClaimsByPolicy(id),
    enabled: !!id
  });
}

export function usePolicyDocuments(id) {
  return useQuery({
    queryKey: ["policy", id, "documents"],
    queryFn: () => fetchDocumentsByPolicy(id),
    enabled: !!id
  });
}