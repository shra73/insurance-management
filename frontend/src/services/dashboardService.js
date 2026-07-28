import axiosInstance from "../api/axiosInstance";

export async function fetchDashboardSummary() {
  const { data } = await axiosInstance.get("/api/dashboard/summary");
  return data;
}

export async function fetchMonthlyPremiums() {
  const { data } = await axiosInstance.get("/api/dashboard/monthly-premiums");
  return data;
}

export async function fetchMonthlyClaims() {
  const { data } = await axiosInstance.get("/api/dashboard/monthly-claims");
  return data;
}

export async function fetchPolicyStatus() {
  const { data } = await axiosInstance.get("/api/dashboard/policy-status");
  return data;
}

export async function fetchClaimStatus() {
  const { data } = await axiosInstance.get("/api/dashboard/claim-status");
  return data;
}