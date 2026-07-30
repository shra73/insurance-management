import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchPolicies } from "../services/policyService";

export function usePolicies(params) {
  return useQuery({
    queryKey: ["policies", params],
    queryFn: () => fetchPolicies(params),
    placeholderData: keepPreviousData
  });
}