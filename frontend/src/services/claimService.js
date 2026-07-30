import axiosInstance from "../api/axiosInstance";

export async function fetchClaims(params) {
  const { data } = await axiosInstance.get("/api/claims", { params });
  return data;
}

export async function fetchClaimsByPolicy(policyId) {
  const { data } = await axiosInstance.get("/api/claims", { 
    params: { policyId } 
  });
  return data;
}

export async function fetchClaimById(id) {
  const { data } = await axiosInstance.get(`/api/claims/${id}`);
  return data.claim;
}

export async function createClaim(payload) {
  const { data } = await axiosInstance.post("/api/claims", payload);
  return data;
}

export async function updateClaim(id, payload) {
  const { data } = await axiosInstance.patch(`/api/claims/${id}`, payload);
  return data;
}

export async function updateClaimStatus(id, status) {
  const { data } = await axiosInstance.patch(`/api/claims/${id}/status`, { status });
  return data;
}