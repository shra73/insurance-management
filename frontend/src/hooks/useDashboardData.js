import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardSummary,
  fetchMonthlyPremiums,
  fetchMonthlyClaims,
  fetchPolicyStatus,
  fetchClaimStatus
} from "../services/dashboardService";

// Each dashboard section is its own independent query, so one slow/failed
// endpoint (e.g. monthly-claims) doesn't block the others from rendering --
// KPI cards can show while a chart is still loading or retrying.

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: fetchDashboardSummary
  });
}

export function useMonthlyPremiums() {
  return useQuery({
    queryKey: ["dashboard", "monthly-premiums"],
    queryFn: fetchMonthlyPremiums
  });
}

export function useMonthlyClaims() {
  return useQuery({
    queryKey: ["dashboard", "monthly-claims"],
    queryFn: fetchMonthlyClaims
  });
}

export function usePolicyStatus() {
  return useQuery({
    queryKey: ["dashboard", "policy-status"],
    queryFn: fetchPolicyStatus
  });
}

export function useClaimStatus() {
  return useQuery({
    queryKey: ["dashboard", "claim-status"],
    queryFn: fetchClaimStatus
  });
}