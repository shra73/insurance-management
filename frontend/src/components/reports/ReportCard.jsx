import { useState } from "react";
import { toast } from "react-toastify";
import { downloadReportPdf, downloadReportExcel } from "../../services/reportService";

export default function ReportCard({ report }) {
  const [downloading, setDownloading] = useState(null); // "pdf" | "excel" | null

  const handleDownload = async (type) => {
    setDownloading(type);
    try {
      if (type === "pdf") {
        await downloadReportPdf(report);
      } else {
        await downloadReportExcel(report);
      }
      toast.success(`${report.label} downloaded`);
    } catch {
      toast.error(`Failed to download ${report.label}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">{report.label}</h3>
      <p className="text-xs text-gray-500 mb-4 flex-1">{report.description}</p>
      <div className="flex gap-2">
        <button
          onClick={() => handleDownload("pdf")}
          disabled={downloading !== null}
          className="flex-1 bg-primary text-white text-xs font-medium py-2 rounded-lg hover:bg-primary-light disabled:opacity-60"
        >
          {downloading === "pdf" ? "Downloading..." : "Download PDF"}
        </button>
        <button
          onClick={() => handleDownload("excel")}
          disabled={downloading !== null}
          className="flex-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-60"
        >
          {downloading === "excel" ? "Downloading..." : "Download Excel"}
        </button>
      </div>
    </div>
  );
}