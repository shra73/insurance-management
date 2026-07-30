import { Link } from "react-router-dom";

const STATUS_STYLES = {
  ACTIVE: "bg-green-100 text-green-700",
  EXPIRED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700"
};

export default function PolicyTable({ policies, onEdit, onRenew, onCancel, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
            <th className="px-4 py-3">Policy Number</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Premium</th>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">End</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {policies.map((policy) => (
            <tr key={policy.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link
                  to={`/policies/${policy.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {policy.policy_number}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">{policy.type}</td>
              <td className="px-4 py-3 text-gray-600">₹{policy.premium_amount}</td>
              <td className="px-4 py-3 text-gray-600">{policy.start_date}</td>
              <td className="px-4 py-3 text-gray-600">{policy.end_date}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_STYLES[policy.status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {policy.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <button onClick={() => onEdit(policy)} className="text-primary hover:underline">
                    Edit
                  </button>
                  <button onClick={() => onRenew(policy)} className="text-green-700 hover:underline">
                    Renew
                  </button>
                  <button onClick={() => onCancel(policy)} className="text-amber-700 hover:underline">
                    Cancel
                  </button>
                  <button onClick={() => onDelete(policy)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}