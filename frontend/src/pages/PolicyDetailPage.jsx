import { useParams, Link } from "react-router-dom";
import {
  usePolicy,
  usePolicyPremiumHistory,
  usePolicyClaims,
  usePolicyDocuments
} from "../hooks/usePolicy";
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

export default function PolicyDetailPage() {
  const { id } = useParams();
  const { data: policy, isLoading, isError, refetch } = usePolicy(id);
  const { data: premiumData, isLoading: premiumLoading } = usePolicyPremiumHistory(id);
  const { data: claimsData, isLoading: claimsLoading } = usePolicyClaims(id);
  const { data: documentsData, isLoading: documentsLoading } = usePolicyDocuments(id);

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Couldn't load this policy." onRetry={refetch} />;
  if (!policy) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/policies" className="text-sm text-primary hover:underline">
          &larr; Back to Policies
        </Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{policy.policy_number}</h1>
      </div>

      {/* Policy Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Policy Information</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Type</dt>
            <dd className="font-medium text-gray-900">{policy.type}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Status</dt>
            <dd className="font-medium text-gray-900">{policy.status}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Premium Amount</dt>
            <dd className="font-medium text-gray-900">₹{policy.premium_amount}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Start Date</dt>
            <dd className="font-medium text-gray-900">{policy.start_date}</dd>
          </div>
          <div>
            <dt className="text-gray-500">End Date</dt>
            <dd className="font-medium text-gray-900">{policy.end_date}</dd>
          </div>
        </dl>
      </div>

      {/* Customer Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h3>
        <p className="text-sm text-gray-600">
          Customer ID: <b>{policy.customer_id}</b> —{" "}
          <Link to={`/customers/${policy.customer_id}`} className="text-primary hover:underline">
            View customer profile
          </Link>
        </p>
      </div>

      {/* Premium History -- real data */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Premium History</h3>
        {premiumLoading && <p className="text-sm text-gray-500">Loading...</p>}
        {!premiumLoading && premiumData && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Total Paid</p>
                <p className="font-semibold text-gray-900">₹{premiumData.summary.total_paid}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Outstanding</p>
                <p className="font-semibold text-gray-900">
                  ₹{premiumData.summary.outstanding_amount}
                </p>
              </div>
            </div>
            {premiumData.payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments recorded yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {premiumData.payments.map((p) => (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="py-2 pr-4">₹{p.amount}</td>
                      <td className="py-2 pr-4">{p.payment_status}</td>
                      <td className="py-2 pr-4">{p.payment_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* Claims History -- real data */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Claims History</h3>
        {claimsLoading && <p className="text-sm text-gray-500">Loading...</p>}
        {!claimsLoading && claimsData?.claims?.length === 0 && (
          <p className="text-sm text-gray-500">No claims filed for this policy.</p>
        )}
        {!claimsLoading && claimsData?.claims?.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                <th className="py-2 pr-4">Claim Number</th>
                <th className="py-2 pr-4">Amount</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {claimsData.claims.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{c.claim_number}</td>
                  <td className="py-2 pr-4">₹{c.claim_amount}</td>
                  <td className="py-2 pr-4">{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Documents -- real data */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Documents</h3>
        {documentsLoading && <p className="text-sm text-gray-500">Loading...</p>}
        {!documentsLoading && documentsData?.documents?.length === 0 && (
          <p className="text-sm text-gray-500">No documents uploaded for this policy.</p>
        )}
        {!documentsLoading && documentsData?.documents?.length > 0 && (
          <ul className="space-y-2">
            {documentsData.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{d.original_file_name}</span>
                <span className="text-gray-400 text-xs">{d.document_type}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <PlaceholderSection
        title="Email Notification History"
        note="No endpoint currently exists for retrieving a policy's sent-email history. This section will populate once that backend feature is available."
      />
    </div>
  );
}