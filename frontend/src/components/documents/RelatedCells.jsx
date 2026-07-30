import { Link } from "react-router-dom";
import { useDocumentRelated } from "../../hooks/useDocumentRelated";

export function RelatedPolicyCell({ policyId }) {
  const { isLoading, policyNumber } = useDocumentRelated(policyId);
  if (isLoading) return <span className="inline-block h-3 w-16 bg-gray-200 rounded animate-pulse" />;
  return (
    <Link to={`/policies/${policyId}`} className="text-primary hover:underline">
      {policyNumber || "—"}
    </Link>
  );
}

export function RelatedCustomerCell({ policyId }) {
  const { isLoading, customerName } = useDocumentRelated(policyId);
  if (isLoading) return <span className="inline-block h-3 w-20 bg-gray-200 rounded animate-pulse" />;
  return <span>{customerName || "—"}</span>;
}