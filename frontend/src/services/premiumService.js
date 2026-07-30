import axiosInstance from "../api/axiosInstance";

export async function fetchPremiums(params) {
  const { data } = await axiosInstance.get("/api/premiums", { params });
  return data;
}

export async function fetchPremiumHistory(policyId) {
  const { data } = await axiosInstance.get(`/api/premiums/policy/${policyId}`);
  return data;
}

export async function createPremiumPayment(payload) {
  const { data } = await axiosInstance.post("/api/premiums", payload);
  return data;
}

export async function downloadPremiumReportPdf() {
  const response = await axiosInstance.get("/api/reports/premiums/pdf", {
    responseType: "blob"
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "premium_report.pdf");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
