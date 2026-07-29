import { useQuery } from "@tanstack/react-query";
import { fetchPoliciesByCustomer } from "../../services/policyService";

// Derives policy count from the existing Get-All-Policies endpoint's
// pagination.total, since the Customer API has no direct policy_count field.
export default function PolicyCountBadge({ customerId }) {
  const { data, isLoading } = useQuery({
    queryKey: ["customer", customerId, "policyCount"],
    queryFn: () => fetchPoliciesByCustomer(customerId, { per_page: 1 })
  });

  if (isLoading) {
    return <span className="inline-block h-3 w-6 bg-gray-200 rounded animate-pulse"></span>;
  }

  return <span>{data?.pagination?.total ?? 0}</span>;
}