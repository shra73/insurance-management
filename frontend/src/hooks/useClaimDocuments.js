import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../api/axiosInstance";

// Claim-related documents are just Policy documents with
// document_type = "CLAIM_DOCUMENT" -- no claim-specific storage exists.
export function useClaimDocuments(policyId) {
  return useQuery({
    queryKey: ["documents", "policy", policyId, "CLAIM_DOCUMENT"],
    queryFn: async () => {
      const { data } = await axiosInstance.get("/api/documents", {
        params: { policy_id: policyId, document_type: "CLAIM_DOCUMENT", per_page: 50 }
      });
      return data;
    },
    enabled: !!policyId
  });
}

export async function uploadClaimDocument({ policyId, file }) {
  const formData = new FormData();
  formData.append("policy_id", policyId);
  formData.append("document_type", "CLAIM_DOCUMENT");
  formData.append("file", file);

  const { data } = await axiosInstance.post("/api/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function downloadDocument(documentId, filename) {
  const response = await axiosInstance.get(`/api/documents/${documentId}/download`, {
    responseType: "blob"
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename || "document");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}