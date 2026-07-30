import axiosInstance from "../api/axiosInstance";

export async function fetchDocuments(params) {
  const { data } = await axiosInstance.get("/api/documents", { params });
  return data;
}

export async function fetchDocumentById(id) {
  const { data } = await axiosInstance.get(`/api/documents/${id}`);
  return data.document;
}

export async function fetchDocumentsByPolicy(policyId, params = {}) {
  const { data } = await axiosInstance.get("/api/documents", {
    params: { policy_id: policyId, ...params }
  });
  return data;
}

export async function uploadDocument({ policyId, documentType, file }) {
  const formData = new FormData();
  formData.append("policy_id", policyId);
  formData.append("document_type", documentType);
  formData.append("file", file);

  const { data } = await axiosInstance.post("/api/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function deleteDocument(id) {
  const { data } = await axiosInstance.delete(`/api/documents/${id}`);
  return data;
}

export async function fetchDocumentBlob(id) {
  const response = await axiosInstance.get(`/api/documents/${id}/download`, {
    responseType: "blob"
  });
  const contentType = response.headers["content-type"];
  const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: contentType }));
  return { blobUrl, contentType };
}

export async function triggerDownload(id, filename) {
  const response = await axiosInstance.get(`/api/documents/${id}/download`, {
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
