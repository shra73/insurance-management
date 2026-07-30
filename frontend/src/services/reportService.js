import axiosInstance from "../api/axiosInstance";

// A single generic downloader reused for all 8 report endpoints -- avoids
// writing near-identical blob-download code 8 times.
async function downloadReport(path, filename) {
  const response = await axiosInstance.get(path, { responseType: "blob" });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const REPORT_TYPES = [
  {
    key: "customers",
    label: "Customer Report",
    description: "All customer records with contact details.",
    pdfPath: "/api/reports/customers/pdf",
    excelPath: "/api/reports/customers/excel",
    pdfFilename: "customer_report.pdf",
    excelFilename: "customer_report.xlsx"
  },
  {
    key: "policies",
    label: "Policy Report",
    description: "All policies with premium and status details.",
    pdfPath: "/api/reports/policies/pdf",
    excelPath: "/api/reports/policies/excel",
    pdfFilename: "policy_report.pdf",
    excelFilename: "policy_report.xlsx"
  },
  {
    key: "premiums",
    label: "Premium Report",
    description: "All premium payment transactions.",
    pdfPath: "/api/reports/premiums/pdf",
    excelPath: "/api/reports/premiums/excel",
    pdfFilename: "premium_report.pdf",
    excelFilename: "premium_report.xlsx"
  },
  {
    key: "claims",
    label: "Claims Report",
    description: "All filed claims with amounts and status.",
    pdfPath: "/api/reports/claims/pdf",
    excelPath: "/api/reports/claims/excel",
    pdfFilename: "claim_report.pdf",
    excelFilename: "claim_report.xlsx"
  }
];

export async function downloadReportPdf(report) {
  await downloadReport(report.pdfPath, report.pdfFilename);
}

export async function downloadReportExcel(report) {
  await downloadReport(report.excelPath, report.excelFilename);
}