import { usePremiumRowContext } from "../../hooks/usePremiumRowContext";

export function CustomerNameCell({ policyId }) {
  const { isLoading, customerName } = usePremiumRowContext(policyId);
  if (isLoading) return <span className="inline-block h-3 w-20 bg-gray-200 rounded animate-pulse" />;
  return <span>{customerName || "—"}</span>;
}

export function OutstandingCell({ policyId }) {
  const { isLoading, outstandingAmount } = usePremiumRowContext(policyId);
  if (isLoading) return <span className="inline-block h-3 w-14 bg-gray-200 rounded animate-pulse" />;
  return <span>₹{outstandingAmount ?? "—"}</span>;
}