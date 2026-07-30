import { Link } from "react-router-dom";
import { CustomerNameCell, OutstandingCell } from "./PremiumRowContext";

const STATUS_STYLES = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  PARTIAL: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700"
};

export default function PremiumTable({ premiums }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
            <th className="px-4 py-3">Receipt Ref</th>
            <th className="px-4 py-3">Policy Number</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Amount Paid</th>
            <th className="px-4 py-3">Outstanding</th>
            <th className="px-4 py-3">Payment Date</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {premiums.map((p) => (
            <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-600">{p.payment_reference || "—"}</td>
              <td className="px-4 py-3">
                <Link
                  to={`/policies/${p.policy_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {p.policy_number}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">
                <CustomerNameCell policyId={p.policy_id} />
              </td>
              <td className="px-4 py-3 text-gray-600">₹{p.amount}</td>
              <td className="px-4 py-3 text-gray-600">
                <OutstandingCell policyId={p.policy_id} />
              </td>
              <td className="px-4 py-3 text-gray-600">{p.payment_date || "—"}</td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    STATUS_STYLES[p.payment_status] || "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p.payment_status}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  to={`/premiums/${p.id}`}
                  className="text-primary hover:underline text-xs font-medium"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}