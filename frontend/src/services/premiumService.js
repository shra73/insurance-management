import axiosInstance from "../api/axiosInstance";

export async function fetchPremiumHistory(policyId) {
  const { data } = await axiosInstance.get(`/api/premiums/policy/${policyId}`);
  return data;
}