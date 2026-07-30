import axiosInstance from "../api/axiosInstance";

export async function fetchDocumentsByPolicy(policyId) {
  const { data } = await axiosInstance.get("/api/documents", {
    params: { policy_id: policyId, per_page: 50 }
  });
  return data;
}