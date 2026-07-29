import { useParams, Link } from "react-router-dom";
import { useCustomer, useCustomerPolicies } from "../hooks/useCustomer";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";

function PlaceholderSection({ title, note }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{note}</p>
    </div>
  );
}

export default function CustomerDetailPage() {
  const { id } = useParams();
  const { data: customer, isLoading, isError, refetch } = useCustomer(id);
  const { data: policiesData, isLoading: policiesLoading } = useCustomerPolicies(id);

  if (isLoading) return <LoadingSpinner />;
  if (isError)
    return <ErrorState message="Couldn't load this customer." onRetry={refetch} />;
  if (!customer) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/customers" className="text-sm text-primary hover:underline">
            &larr; Back to Customers
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-1">{customer.name}</h1>
        </div>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Profile</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="font-medium text-gray-900">{customer.phone}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Date of Birth</dt>
            <dd className="font-medium text-gray-900">{customer.dob}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Address</dt>
            <dd className="font-medium text-gray-900">{customer.address}</dd>
          </div>
        </dl>
      </div>

      {/* Policies -- real data, via GET /api/policies?customer_id= */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Policies</h3>
        {policiesLoading && <p className="text-sm text-gray-500">Loading policies...</p>}
        {!policiesLoading && policiesData?.policies?.length === 0 && (
          <p className="text-sm text-gray-500">No policies found for this customer.</p>
        )}
        {!policiesLoading && policiesData?.policies?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
                  <th className="py-2 pr-4">Policy Number</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Premium</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {policiesData.policies.map((policy) => (
                  <tr key={policy.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium text-gray-900">
                      {policy.policy_number}
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{policy.type}</td>
                    <td className="py-2 pr-4 text-gray-600">₹{policy.premium_amount}</td>
                    <td className="py-2 pr-4 text-gray-600">{policy.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* No customer-level endpoints exist for these yet -- placeholders,
          per spec, rather than fabricated data. */}
      <PlaceholderSection
        title="Premium History"
        note="Premium history is currently only available per policy, not aggregated per customer. View an individual policy to see its payment history."
      />
      <PlaceholderSection
        title="Claims"
        note="Claims are currently only filterable by policy, not by customer directly. This section will be available once a customer-level claims endpoint exists."
      />
      <PlaceholderSection
        title="Documents"
        note="Documents are currently only filterable by policy, not by customer directly. This section will be available once a customer-level documents endpoint exists."
      />
    </div>
  );
}