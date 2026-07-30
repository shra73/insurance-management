import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { usePremiums } from "../hooks/usePremiums";
import { usePremiumRowContext } from "../hooks/usePremiumRowContext";
import { downloadPremiumReportPdf } from "../services/premiumService";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";
import { useState } from "react";

const STATUS_STYLES = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  PARTIAL: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700"
};

export default function PremiumDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  // No single-payment GET endpoint exists on the backend -- the payment's
  // own fields are found by locating it within the general premium list
  // (searched by receipt reference or scanning a reasonable page size).
  // This is a workaround for a missing backend capability, flagged here
  // rather than hidden.
  const { data, isLoading, isError, refetch } = usePremiums({ per_page: 100 });
  const payment = data?.premiums?.find((p) => String(p.id) === id);

  const context = usePremiumRowContext(payment?.policy_id);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Couldn't load payment details." onRetry={refetch} />;
  if (!payment) {
    return (
      <ErrorState
        message="This payment could not be found (it may be outside the first 100 records -- no direct lookup endpoint exists yet)."
        onRetry={() => navigate("/premiums")}
      />
    );
  }

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadPremiumReportPdf();
      toast.info("Downloaded the full premium report (no single-receipt PDF endpoint exists yet).");
    } catch {
      toast.error("Failed to download report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <button
        onClick={() => navigate("/premiums")}
        className="text-sm text-primary hover:underline"
      >
        &larr; Back to Premiums
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-bold text-gray-900">Payment Details</h1>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              STATUS_STYLES[payment.payment_status] || "bg-gray-100 text-gray-600"
            }`}
          >
            {payment.payment_status}
          </span>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Customer</dt>
            <dd className="font-medium text-gray-900">{context.customerName || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Policy Number</dt>
            <dd className="font-medium text-gray-900">{payment.policy_number}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Premium Amount</dt>
            <dd className="font-medium text-gray-900">₹{context.premiumAmount ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Amount Paid</dt>
            <dd className="font-medium text-gray-900">₹{payment.amount}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Outstanding Balance</dt>
            <dd className="font-medium text-gray-900">₹{context.outstandingAmount ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Payment Date</dt>
            <dd className="font-medium text-gray-900">{payment.payment_date || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Payment Reference</dt>
            <dd className="font-medium text-gray-900">{payment.payment_reference || "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Receipt ID</dt>
            <dd className="font-medium text-gray-900">#{payment.id}</dd>
          </div>
        </dl>

        {payment.payment_status === "PAID" && (
          <div className="mt-5 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
            A payment receipt email was automatically sent to the customer by the
            system when this payment was recorded.
          </div>
        )}

        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="mt-5 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light disabled:opacity-60"
        >
          {isDownloading ? "Downloading..." : "Download Premium Report (PDF)"}
        </button>
      </div>
    </div>
  );
}