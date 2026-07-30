import axiosInstance from "../api/axiosInstance";

export async function fetchClaimsByPolicy(policyId) {
  const { data } = await axiosInstance.get("/api/claims", {
    params: { policy_id: policyId, per_page: 50 }
  });
  return data;
}