import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchPremiums, fetchPremiumHistory } from "../services/premiumService";

export function usePremiums(params) {
  return useQuery({
    queryKey: ["premiums", params],
    queryFn: () => fetchPremiums(params),
    placeholderData: keepPreviousData
  });
}

export function usePremiumHistory(policyId) {
  return useQuery({
    queryKey: ["premiumHistory", policyId],
    queryFn: () => fetchPremiumHistory(policyId),
    enabled: !!policyId
  });
}