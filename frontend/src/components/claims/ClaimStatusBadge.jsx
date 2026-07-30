const STATUS_STYLES = {
  PENDING: "bg-amber-100 text-amber-700",
  UNDER_REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  SETTLED: "bg-primary/10 text-primary"
};

export default function ClaimStatusBadge({ status }) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}