import { Link } from "react-router-dom";
import ClaimStatusBadge from "./ClaimStatusBadge";
import { useAuth } from "../../hooks/useAuth";

export default function ClaimTable({ claims, onUpdateStatus, onEdit }) {
  const { user } = useAuth();
  const canManageStatus = user?.role === "ADMIN" || user?.role === "AGENT";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
            <th className="px-4 py-3">Claim Number</th>
            <th className="px-4 py-3">Policy Number</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Submitted</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  to={`/claims/${claim.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {claim.claim_number}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">
                <Link to={`/policies/${claim.policy_id}`} className="hover:underline">
                  {claim.policy_number}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">₹{claim.claim_amount}</td>
              <td className="px-4 py-3 text-gray-600">{claim.claim_date}</td>
              <td className="px-4 py-3">
                <ClaimStatusBadge status={claim.status} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3 text-xs font-medium">
                  {["PENDING", "UNDER_REVIEW"].includes(claim.status) && (
                    <button onClick={() => onEdit(claim)} className="text-primary hover:underline">
                      Edit
                    </button>
                  )}
                  {canManageStatus && (
                    <button
                      onClick={() => onUpdateStatus(claim)}
                      className="text-green-700 hover:underline"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}