import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchClaims, fetchClaimById } from "../services/claimService";

export function useClaims(params) {
  return useQuery({
    queryKey: ["claims", params],
    queryFn: () => fetchClaims(params),
    placeholderData: keepPreviousData
  });
}

export function useClaim(id) {
  return useQuery({
    queryKey: ["claim", id],
    queryFn: () => fetchClaimById(id),
    enabled: !!id
  });
}